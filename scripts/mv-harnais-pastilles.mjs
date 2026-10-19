#!/usr/bin/env node
/* mv-harnais-pastilles — LE JEU DE PASTILLES COMMUN (CHARTE-4, §374).
   Décidé le 19/10 après lecture d’Atlassian, Carbon et Primer : le statut porte la couleur de sens,
   l’étiquette est neutre, une étiquette n’est colorée que pour dire un type, le compteur est neutre
   (accent si le nombre compte, rouge pour une alerte), le filtre se touche. Ce contrôle tient :
     A. les pièces sont dans le bloc CHARTE-4 de src/styles.css ;
     B. le bloc n’écrit aucune couleur en dur, aucune taille de texte en px, aucune capitale ;
     C. les classes passées au jeu ne reprennent aucune allure ailleurs (feuille, CSS des modules,
        style écrit sur place) — sauf exemption écrite avec sa raison ;
     D. le nombre de pastilles « maison » (une classe de pastille qui se peint elle-même hors du jeu)
        ne remonte pas — PLAFOND ne peut que baisser ;
     E. la charte porte les neuf couleurs de type et les trois textes d’état, en clair et en sombre.
   Usage : node scripts/mv-harnais-pastilles.mjs [--contre] */
import { readFileSync, readdirSync } from 'node:fs';
const ROOT = new URL('..', import.meta.url).pathname;
const lire = p => readFileSync(ROOT + p, 'utf8');
const DEBUT = '/* ═══ CHARTE-4 — LE JEU DE PASTILLES COMMUN';
const COULEURS = ['vert', 'ambre', 'bleu', 'violet', 'rouge', 'canard', 'ciel', 'gris', 'orange'];
const PIECES = ['mvpas', 'mvpas-statut', 'mvpas-fait', 'mvpas-encours', 'mvpas-afaire', 'mvpas-surveiller', 'mvpas-retard',
  'mvpas-etiquette', 'mvpas-type', ...COULEURS.map(c => 'mvpas-' + c), 'mvpas-compteur', 'mvpas-fort', 'mvpas-alerte', 'mvpas-filtre'];
const MIGREES = ['pf-tag', 'pf-tag-sup', 'pf-tag-al', 'plan-badge', 'plan-badge-warn', 'plan-badge-abs', 'plan-badge-cont', 'plan-badge-def',
  'plan-badge-ctrat', 'plan-badge-cdebut', 'plan-badge-cfin', 'mvc-tag', 'mvc-tag-so2', 'mvc-tag-fmlok', 'mvc-tag-fmlc', 'mvc-tag-fmlno',
  'mvc-tag-av', 'sdp-tag', 'pil-dz-tag', 'chat-canal-badge', 'p-fx-badge'];   // ★ CHARTE-4a (§374)
const EXEMPTIONS = [
  { selecteur: '.sdp-tag small', raison: 'le second rang d’une pastille de session (la mesure sous l’écart) : un petit texte, pas une pastille' }
];
const PLAFOND = 92;   // CHARTE-4a (§374) : relevé au premier passage ; ne peut que baisser
const ALLURE = /^(background(-color|-image)?|color|border(-(color|width|style|radius|top|bottom|left|right))?|box-shadow|font|font-(size|weight|family)|padding(-[a-z]+)?|height|min-height|line-height|text-transform|letter-spacing)$/;
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const porte = (sel, c) => new RegExp('\\.' + c.replace(/-/g, '\\-') + '(?![\\w-])').test(sel.replace(/:not\([^)]*\)/g, ''));
function decouper(css) {
  const i = css.indexOf(DEBUT); if (i < 0) return { bloc: '', hors: css };
  const j = css.indexOf('/* ★ FIN CHARTE-4 */', i);   // le bloc se ferme par sa marque : il n’est pas en fin de feuille (TETE-2 l’est)
  return { bloc: css.slice(i, j < 0 ? css.length : j), hors: css.slice(0, i) + (j < 0 ? '' : css.slice(j)) };
}
function regles(css) {
  const out = []; const s = sansCom(css).replace(/@media[^{]*\{/g, ''); const re = /([^{}]+)\{([^{}]*)\}/g; let m;
  while ((m = re.exec(s))) out.push({ sel: m[1].trim(), decl: m[2] });
  return out;
}
const allures = decl => decl.split(';').map(d => d.trim()).filter(Boolean).map(d => d.split(':')[0].trim().toLowerCase()).filter(p => ALLURE.test(p));
function cssDesModules(js) { return [...js.matchAll(/(\.[a-zA-Z][\w-]*[^{}'"`\n]*)\{([^{}'"`]*)\}/g)].map(m => ({ sel: m[1].trim(), decl: m[2] })); }
function maison(hors) {   // une classe de pastille qui se peint elle-même hors du jeu
  const n = new Set();
  for (const r of regles(hors)) {
    if (!/(^|;)\s*(background(-color)?|border-radius)\s*:/.test(r.decl)) continue;
    for (const c of r.sel.match(/\.[a-zA-Z][\w-]*/g) || []) {
      const k = c.slice(1);
      if (/(^|-)(chip|chips|pill|badge|pastille|tag)(-|$)/.test(k) && !/-(lbl|label|ico|icon|sub|row|wrap|bar|list|zone|txt|text|cnt|dot|in|x|close)$/.test(k)) n.add(k);
    }
  }
  return n;
}
function verifier({ charte, feuille, modules }) {
  const R = []; const t = (nom, ok, det) => R.push({ nom, ok, det });
  const { bloc, hors } = decouper(feuille);
  const rb = regles(bloc);
  const manquent = PIECES.filter(p => !rb.some(r => porte(r.sel, p)));
  t(`les pièces du jeu sont dans le bloc CHARTE-4 (${PIECES.length})`, !!bloc && !manquent.length, manquent.length ? 'manquent : ' + manquent.join(', ') : '');
  const durs = rb.flatMap(r => {
    const f = [];
    if (/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|:\s*(white|black|red|green|blue)\b/.test(r.decl.replace(/var\([^)]*\)/g, ''))) f.push(r.sel + ' : couleur en dur');
    if (/font-size\s*:\s*\d/.test(r.decl)) f.push(r.sel + ' : taille de texte en px');
    if (/text-transform\s*:\s*uppercase/.test(r.decl)) f.push(r.sel + ' : capitales');
    return f;
  });
  t('le bloc n’écrit aucune couleur ni taille de texte en dur, aucune capitale', !durs.length, durs.slice(0, 3).join(' · '));
  const exempte = sel => EXEMPTIONS.some(e => e.selecteur === sel);
  const fautes = [];
  for (const r of regles(hors)) for (const c of MIGREES) if (porte(r.sel, c) && !exempte(r.sel) && allures(r.decl).length) fautes.push(`src/styles.css : « ${r.sel.slice(0, 60)} » reprend ${allures(r.decl).join(', ')}`);
  for (const [nom, js] of Object.entries(modules)) {
    for (const r of cssDesModules(js)) for (const c of MIGREES) if (porte(r.sel, c) && allures(r.decl).length) fautes.push(`${nom} : CSS « ${r.sel.slice(0, 50)} »`);
    for (const m of js.matchAll(/class=\\?["']([^"'<>\\]*)\\?["'][^<>]*?style=\\?["']([^"'\\]*)/g)) {
      const cl = m[1].split(/\s+/);
      if (MIGREES.some(c => cl.includes(c)) && /(^|;)\s*(background|color|border|padding|font-size|font-weight|height|border-radius)\s*:/.test(m[2])) fautes.push(`${nom} : style écrit sur place à côté de « ${cl.find(c => MIGREES.includes(c))} »`);
    }
  }
  t(`les ${MIGREES.length} classes passées au jeu ne reprennent aucune allure ailleurs`, !fautes.length, fautes.slice(0, 3).join('\n      → '));
  const nb = maison(hors).size;
  t(`les pastilles « maison » ne remontent pas (${nb} ≤ ${PLAFOND})`, nb <= PLAFOND, nb < PLAFOND ? '' : '');
  R.baisse = nb < PLAFOND ? `↓ ${PLAFOND - nb} de moins — baisser PLAFOND dans ce fichier` : '';
  R.mesure = nb;
  const c = sansCom(charte);
  const tok = [...COULEURS.map((x, i) => ['green', 'amber', 'blue', 'purple', 'red', 'teal', 'sky', 'grey', 'orange'][i]).flatMap(e => [`--tag-${e}-bg`, `--tag-${e}-tx`]), '--ok-texte', '--attention-texte', '--danger-texte'];
  const blocs = [c.slice(c.indexOf(':root{')), c.slice(c.indexOf('[data-theme="dark"]'))];
  const absents = tok.filter(k => !blocs.every(b => b.includes(k + ':')));
  t('la charte porte les couleurs de type et les textes d’état, en clair et en sombre', !absents.length, absents.join(', '));
  return R;
}
const lireTout = () => {
  const modules = {};
  for (const f of readdirSync(ROOT + 'src')) if (f.endsWith('.js')) modules['src/' + f] = lire('src/' + f);
  modules['index.html'] = lire('index.html');
  return { charte: lire('src/charte.css'), feuille: lire('src/styles.css'), modules };
};
const V = s => `\x1b[32m✓\x1b[0m ${s}`, X = s => `\x1b[31m✗\x1b[0m ${s}`;
if (!process.argv.includes('--contre')) {
  console.log('\n── LE JEU DE PASTILLES COMMUN (CHARTE-4)\n');
  const R = verifier(lireTout());
  for (const r of R) { console.log('  ' + (r.ok ? V(r.nom) : X(r.nom))); if (!r.ok && r.det) console.log('      → ' + r.det); }
  if (R.baisse) console.log('    \x1b[33m' + R.baisse + '\x1b[0m');
  const ko = R.filter(r => !r.ok).length;
  console.log(`\n  ${R.length - ko} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
} else {
  console.log('\n── CONTRE-ÉPREUVES — le jeu de pastilles commun (CHARTE-4)\n');
  const base = lireTout(); let ok = 0, ko = 0;
  const rougit = (nom, idx, muter) => {
    const x = structuredClone(base); muter(x); const R = verifier(x);
    const bon = idx === null ? R.every(r => r.ok) : !R[idx].ok;
    console.log('  ' + (bon ? V(nom) : X(nom))); bon ? ok++ : ko++;
  };
  rougit('une pièce disparaît du bloc → la règle A rougit', 0, x => { x.feuille = x.feuille.replace('.mvpas-retard, ', '.mvpas-xretard, '); });
  rougit('le bloc écrit une couleur en dur → la règle B rougit', 1, x => { x.feuille = x.feuille.replace('.mvpas-etiquette{ background:var(--survol);', '.mvpas-etiquette{ background:#EEE;'); });
  rougit('le bloc écrit une capitale → la règle B rougit', 1, x => { x.feuille = x.feuille.replace('.mvpas-etiquette{ background:var(--survol);', '.mvpas-etiquette{ text-transform:uppercase; background:var(--survol);'); });
  rougit('une classe passée au jeu reprend un fond dans la feuille → la règle C rougit', 2, x => { x.feuille = '.pf-tag{ background:var(--rouge-pale); }\n' + x.feuille; });
  rougit('une classe passée au jeu reprend un arrondi dans un module → la règle C rougit', 2, x => { x.modules['src/cave.js'] += "\nconst _c='.mvc-tag{border-radius:8px}';"; });
  rougit('un style écrit sur place à côté d’une classe passée au jeu → la règle C rougit', 2, x => { x.modules['src/planning.js'] += `\nconst _h='<span class="pf-tag" style="background:#FAEAE8">x</span>';`; });
  rougit('une pastille « maison » de plus → la règle D rougit', 3, x => { x.feuille = '.essai-badge{ background:var(--or-pale); }\n' + x.feuille; });
  rougit('la charte perd une couleur de type en sombre → la règle E rougit', 4, x => { const i = x.charte.indexOf('[data-theme="dark"]'); x.charte = x.charte.slice(0, i) + x.charte.slice(i).replace(/--tag-blue-bg:/g, '--tag-xblue-bg:'); });
  rougit('témoin — une allure dans un commentaire ne compte pas', null, x => { x.feuille = '/* .pf-tag{ background:red } */\n' + x.feuille; });
  rougit('témoin — la mise en page d’une classe passée au jeu reste permise', null, x => { x.feuille = '.pf-tag{ margin-left:4px; }\n' + x.feuille; });
  console.log(`\n  ${ok} vertes, ${ko} rouges\n`); process.exit(ko ? 1 : 0);
}
