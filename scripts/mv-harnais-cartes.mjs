#!/usr/bin/env node
/* mv-harnais-cartes — LE JEU DE CARTES COMMUN (CHARTE-5, §379).
   Maquette validée le 19/10 : la carte (fond de carte, un filet, arrondi 8 px, pas d’ombre ; cliquable avec les
   états du jeu, choisie au filet d’action), le bloc de chiffres (des cases séparées par un filet), l’encadré
   (quatre tons, une icône, jamais de bordure de côté). Ce contrôle tient :
     A. les pièces sont dans le bloc CHARTE-5 de src/styles.css (fermé par sa marque) ;
     B. le bloc n’écrit aucune couleur en dur ni aucune taille de texte en px ;
     C. les cartes passées au jeu ne reprennent ni fond, ni filet, ni arrondi, ni ombre ailleurs (feuille, CSS des
        modules, style écrit sur place) — leur marge intérieure reste la leur ;
     D. les cartes « maison » (une classe de carte qui se peint elle-même hors du jeu) ne remontent pas ;
     E. la charte porte la couleur « informer » (--info-doux, --info-texte), en clair et en sombre ;
     F. les encadrés faits à la main (bloc arrondi dont le fond et une marge de 6 à 19 px sont écrits sur place)
        ne remontent pas.
   Chemin portable (fileURLToPath, §53/§376) ; fins de ligne CRLF ramenées à LF.
   Usage : node scripts/mv-harnais-cartes.mjs [--contre] */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const lire = p => readFileSync(join(RACINE, p), 'utf8').replace(/\r\n/g, '\n');
const DEBUT = '/* ═══ CHARTE-5 — LE JEU DE CARTES COMMUN', FIN = '/* ★ FIN CHARTE-5 */';
const PIECES = ['mvcarte', 'mvcarte-tete', 'mvcarte-titre', 'mvcarte-clic', 'mvchiffres', 'mvchiffres-v', 'mvchiffres-l',
  'mvencadre', 'mvencadre-t', 'mvencadre-info', 'mvencadre-ok', 'mvencadre-attention', 'mvencadre-danger'];
const MIGREES = ['pf-card', 'mtr-card', 'mur-card',   // ★ CHARTE-5a (§379)
  'cmp-alert'];   // ★ CHARTE-5c (§381) : l’encadré à classe des Réglages
const EXEMPTIONS = [];
const PLAFOND = 48;       // CHARTE-5a (§379) : cartes « maison », relevé au premier passage ; ne peut que baisser (D)
const PLAFOND_ENC = 36;   /* CHARTE-5e (§398) : 105 → 36 — la console GT (50) sortie du décompte (hors charte, décision de Nico), 19 blocs de plus au jeu */ //   /* ZONES-1 (§397) : 114 → 105 (le bilan du domaine en bandeau, la fiche d’une cuvée en bloc de chiffres, cinq encadrés écrits pour le sombre) */ //   /* CHARTE-5d (§396) : 165 → 114, 51 notes grises rendues à l’encadré neutre ; celles d’app.js restent (voir §396) */ //   /* REVUE-3 (§392) : 167 → 165, le budget cuivre et l’encadré bleu de l’assistant phyto */ //   /* REVUE-2 (§390) : 168 → 167, l’encadré des documents */ //   /* CHARTE-5c (§381) : 211 → 168 */ //  // CHARTE-5a (§379) : encadrés faits à la main, 232 au premier passage ; ne peut que baisser (F). CHARTE-5b (§380) : 232 → 211
const ALLURE = /^(background(-color|-image)?|border(-(color|width|style|radius|top|bottom|left|right))?|box-shadow)$/;
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const porte = (sel, c) => new RegExp('\\.' + c.replace(/-/g, '\\-') + '(?![\\w-])').test(sel.replace(/:not\([^)]*\)/g, ''));
function decouper(css) {
  const i = css.indexOf(DEBUT); if (i < 0) return { bloc: '', hors: css };
  const j = css.indexOf(FIN, i);
  return { bloc: css.slice(i, j < 0 ? css.length : j), hors: css.slice(0, i) + (j < 0 ? '' : css.slice(j)) };
}
function regles(css) {
  const out = []; const s = sansCom(css).replace(/@media[^{]*\{/g, ''); const re = /([^{}]+)\{([^{}]*)\}/g; let m;
  while ((m = re.exec(s))) out.push({ sel: m[1].trim(), decl: m[2] });
  return out;
}
const allures = decl => decl.split(';').map(d => d.trim()).filter(Boolean).map(d => d.split(':')[0].trim().toLowerCase()).filter(p => ALLURE.test(p));
const cssDesModules = js => [...js.matchAll(/(\.[a-zA-Z][\w-]*[^{}'"`\n]*)\{([^{}'"`]*)\}/g)].map(m => ({ sel: m[1].trim(), decl: m[2] }));
function maison(hors) {
  const n = new Set();
  for (const r of regles(hors)) {
    if (!/(^|;)\s*(background(-color)?|border-radius)\s*:/.test(r.decl)) continue;
    for (const c of r.sel.match(/\.[a-zA-Z][\w-]*/g) || []) {
      const k = c.slice(1);
      if (/(^|-)(card|cards|carte|cartes|tile|tiles|panel|panneau|encart|box)(-|$)/.test(k) && !/-(lbl|label|ico|icon|sub|row|wrap|list|zone|txt|text|head|hd|body|bd|foot|ft|title|ttl|tit|meta|act|acts|btn|img|in|x|close)$/.test(k)) n.add(k);
    }
  }
  return n;
}
function encadresMain(modules) {
  let n = 0;
  for (const [nom, js] of Object.entries(modules)) {
    if (nom === 'src/admin-gt.js') continue;   // la console GUERETTECH est hors charte, décision de Nico (CHARTE-5e, §398)
    for (const m of js.matchAll(/<(?:div|p|section)\b[^<>]*?style=\\?"([^"\\]*)/g)) {
      const st = m[1];
      if (/border-radius/.test(st) && /background/.test(st) && /padding:\s*(?:[6-9]|1\d)px/.test(st)) n++;
    }
  }
  return n;
}
function verifier({ charte, feuille, modules }, P = PLAFOND, PE = PLAFOND_ENC) {
  const R = []; const t = (nom, ok, det) => R.push({ nom, ok, det });
  const { bloc, hors } = decouper(feuille); const rb = regles(bloc);
  const manquent = PIECES.filter(p => !rb.some(r => porte(r.sel, p)));
  t(`les pièces du jeu sont dans le bloc CHARTE-5 (${PIECES.length})`, !!bloc && !manquent.length, manquent.join(', '));
  const durs = rb.flatMap(r => {
    const f = [];
    if (/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|:\s*(white|black|red|green|blue)\b/.test(r.decl.replace(/var\([^)]*\)/g, ''))) f.push(r.sel + ' : couleur en dur');
    if (/font-size\s*:\s*\d/.test(r.decl)) f.push(r.sel + ' : taille de texte en px');
    return f;
  });
  t('le bloc n’écrit aucune couleur ni taille de texte en dur', !durs.length, durs.slice(0, 3).join(' · '));
  const exempte = sel => EXEMPTIONS.some(e => e.selecteur === sel);
  const fautes = [];
  for (const r of regles(hors)) for (const c of MIGREES) if (porte(r.sel, c) && !exempte(r.sel) && allures(r.decl).length) fautes.push(`src/styles.css : « ${r.sel.slice(0, 60)} » reprend ${allures(r.decl).join(', ')}`);
  for (const [nom, js] of Object.entries(modules)) {
    for (const r of cssDesModules(js)) for (const c of MIGREES) if (porte(r.sel, c) && allures(r.decl).length) fautes.push(`${nom} : CSS « ${r.sel.slice(0, 50)} »`);
    for (const m of js.matchAll(/class=\\?["']([^"'<>\\]*)\\?["'][^<>]*?style=\\?["']([^"'\\]*)/g)) {
      const cl = m[1].split(/\s+/);
      if (MIGREES.some(c => cl.includes(c)) && /(^|;)\s*(background|border|box-shadow)\s*[:-]/.test(m[2])) fautes.push(`${nom} : style écrit sur place à côté de « ${cl.find(c => MIGREES.includes(c))} »`);
    }
  }
  t(`les ${MIGREES.length} cartes passées au jeu ne reprennent ni fond, ni filet, ni arrondi, ni ombre ailleurs`, !fautes.length, fautes.slice(0, 3).join('\n      → '));
  const nb = maison(hors).size;
  t(`les cartes « maison » ne remontent pas (${nb} ≤ ${P})`, nb <= P);
  const c = sansCom(charte), blocs = [c.slice(c.indexOf(':root{')), c.slice(c.indexOf('[data-theme="dark"]'))];
  const absents = ['--info-doux', '--info-texte'].filter(k => !blocs.every(b => b.includes(k + ':')));
  t('la charte porte la couleur « informer », en clair et en sombre', !absents.length, absents.join(', '));
  const ne = encadresMain(modules);
  t(`les encadrés faits à la main ne remontent pas (${ne} ≤ ${PE})`, ne <= PE);
  R.baisse = [nb < P ? `↓ ${P - nb} carte(s) « maison » de moins — baisser PLAFOND` : '', ne < PE ? `↓ ${PE - ne} encadré(s) fait(s) à la main de moins — baisser PLAFOND_ENC` : ''].filter(Boolean).join(' · ');
  R.mesures = { nb, ne };
  return R;
}
const lireTout = () => {
  const modules = {};
  for (const f of readdirSync(join(RACINE, 'src')).sort()) if (f.endsWith('.js')) modules['src/' + f] = lire('src/' + f);
  modules['index.html'] = lire('index.html');
  return { charte: lire('src/charte.css'), feuille: lire('src/styles.css'), modules };
};
const V = s => `\x1b[32m✓\x1b[0m ${s}`, X = s => `\x1b[31m✗\x1b[0m ${s}`;
if (!process.argv.includes('--contre')) {
  console.log('\n── LE JEU DE CARTES COMMUN (CHARTE-5)\n');
  const R = verifier(lireTout());
  for (const r of R) { console.log('  ' + (r.ok ? V(r.nom) : X(r.nom))); if (!r.ok && r.det) console.log('      → ' + r.det); }
  if (R.baisse) console.log('    \x1b[33m' + R.baisse + '\x1b[0m');
  const ko = R.filter(r => !r.ok).length; console.log(`\n  ${R.length - ko} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
} else {
  console.log('\n── CONTRE-ÉPREUVES — le jeu de cartes commun (CHARTE-5)\n');
  const base = lireTout(); let ok = 0, ko = 0;
  const m0 = verifier(base).mesures;   // les épreuves se jouent au plafond exact : une de plus doit rougir
  const rougit = (nom, idx, muter) => {
    const x = structuredClone(base); muter(x); const R = verifier(x, m0.nb, m0.ne);
    const bon = idx === null ? R.every((r, i) => i === 3 || i === 5 ? true : r.ok) : !R[idx].ok;
    console.log('  ' + (bon ? V(nom) : X(nom))); bon ? ok++ : ko++;
  };
  rougit('une pièce disparaît du bloc → la règle A rougit', 0, x => { x.feuille = x.feuille.replace('.mvencadre-danger, ', '.mvencadre-xdanger, ');   /* CHARTE-5c : la règle est groupée avec .cmp-alert.bad */ });
  rougit('le bloc écrit une couleur en dur → la règle B rougit', 1, x => { x.feuille = x.feuille.replace('.mvencadre-info{ background:var(--info-doux);', '.mvencadre-info{ background:#E8F0FA;'); });
  rougit('une carte passée au jeu reprend une ombre dans la feuille → la règle C rougit', 2, x => { x.feuille = '.pf-card{ box-shadow:var(--shadow-sm); }\n' + x.feuille; });
  rougit('une carte passée au jeu reprend un arrondi dans un module → la règle C rougit', 2, x => { x.modules['src/app.js'] += "\nconst _c='.mtr-card{border-radius:15px}';"; });
  rougit('un style écrit sur place à côté d’une carte passée au jeu → la règle C rougit', 2, x => { x.modules['src/app.js'] += `\nconst _h='<div class="mur-card" style="border:1px solid #E7E6E2">x</div>';`; });
  rougit('une carte « maison » de plus → la règle D rougit', 3, x => { x.feuille = '.essai-card{ background:var(--bg-card); border-radius:15px; }\n' + x.feuille; });
  rougit('la charte perd la couleur « informer » en sombre → la règle E rougit', 4, x => { const i = x.charte.indexOf('[data-theme="dark"]'); x.charte = x.charte.slice(0, i) + x.charte.slice(i).replace(/--info-doux:/g, '--info-xdoux:'); });
  rougit('un encadré fait à la main de plus → la règle F rougit', 5, x => { x.modules['src/phyto.js'] += `\nconst _e='<div style="background:var(--vert-pale);border-radius:10px;padding:10px 12px">ok</div>';`; });
  rougit('témoin — une allure dans un commentaire ne compte pas', null, x => { x.feuille = '/* .pf-card{ box-shadow:red } */\n' + x.feuille; });
  rougit('témoin — la marge intérieure d’une carte passée au jeu reste permise', null, x => { x.feuille = '.pf-card{ padding:20px; }\n' + x.feuille; });
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
