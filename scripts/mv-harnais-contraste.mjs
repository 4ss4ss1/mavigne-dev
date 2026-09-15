/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LE CONTRASTE, MESURÉ DANS LES DEUX THÈMES (lot CONTRASTE-1)
   Lancer : node scripts/mv-harnais-contraste.mjs
            node scripts/mv-harnais-contraste.mjs --contre
            node scripts/mv-harnais-contraste.mjs --baseline

   ══ POURQUOI ══
   Soixante-dix scripts de contrôle, et AUCUN ne lisait une couleur. Un texte
   illisible en thème sombre passait tous les filets du projet : la version
   montait, le preflight sortait vert, et personne ne voyait rien — parce que
   personne ne REGARDE le thème sombre à chaque lot.

   ⚠️ La mécanique WCAG existait déjà dans `harnais-vitrine.mjs` (§10c) — mais
      sur SEPT paires écrites à la main. Une liste à la main ne couvre que ce
      qu'on a pensé à y mettre le jour où on l'a écrite : ici, les paires sont
      DÉRIVÉES de la palette et du code. C'est la leçon de §124 (l'export qui
      gardait 8 clés sur 26) appliquée aux couleurs.

   ══ CE QU'IL MESURE ══
     1. Les paires DÉCLARÉES par la palette elle-même :
        · `--tag-X-bg` / `--tag-X-tx`  (le projet dit quel texte va sur quel fond)
        · `--X` / `--X-pale`           (la famille des badges)
        Aucune liste : les familles sortent des NOMS de jetons, donc un
        `--tag-teal-*` ajouté demain est mesuré le jour même.
     2. Les paires ÉCRITES dans le code : toute déclaration qui pose `color:`
        ET `background:` au même endroit — règle CSS ou attribut `style=`.
     3. Les deux thèmes. Le sombre n'est pas une variante cosmétique : il
        redéfinit 40 jetons, et c'est là que se trouvent les trois quarts des
        écarts.

   ══ CE QU'IL NE MESURE PAS, ET LE DIT ══
   ★★★ UN FOND TRANSLUCIDE ANONYME N'EST PAS MESURABLE. `rgba(255,255,255,.05)`
   ne dit pas sur quoi il repose ; supposer la carte donnerait un chiffre faux
   (c'est ce qui faisait sortir 427 « fautes » au premier jet, dont la moitié
   venaient de la console GT, qui a son propre fond sombre). On ne compose que
   les jetons NOMMÉS `--*-pale` / `--*-bg`, dont la palette dit où ils vivent.
   Le reste est compté « fond inconnu » et le compte est AFFICHÉ — un harnais
   qui tait sa couverture est un harnais qui ment sur ce qu'il prouve.

   ⚠️ §25.2 : la contre-épreuve injecte EN MÉMOIRE, avec garde d'injection.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const BASE   = path.join(ICI, 'contraste-baseline.json');
const CONTRE  = process.argv.includes('--contre');
const REGRAVE = process.argv.includes('--baseline');

const AA_NORMAL = 4.5;   /* WCAG AA, texte courant */
const AA_GRAND  = 3.0;   /* WCAG AA, texte large : >= 24 px, ou >= 18.5 px gras */

const FICHIERS = fs.readdirSync(path.join(RACINE, 'src'))
  .filter(f => f.endsWith('.js')).sort().map(f => 'src/' + f)
  .concat(['index.html', 'src/styles.css']);

let SRC = {};
for (const f of FICHIERS) SRC[f] = fs.readFileSync(path.join(RACINE, f), 'utf8');

/* ── Injections ──────────────────────────────────────────────────────────── */
/* ⚠️ Deux de ces quatre injections AJOUTENT du code au lieu de remplacer une
   ancre. C'est deliberé : §127e a montré qu'une injection ancrée sur un
   littéral meurt au premier lot qui touche ce littéral — et qu'elle meurt en
   annonçant « RESTE VERT », c'est-à-dire en accusant le harnais. Une injection
   qui ajoute ne peut pas se périmer. La garde ci-dessous exige les quatre. */
const INJECTIONS = [
  { nom: 'un ton de badge éclairci sous le seuil (thème clair)',
    f: 'src/styles.css', de: '--tag-green-tx:#2D5016', vers: '--tag-green-tx:#8FC97A' },
  /* ⚠️ TOUTES LES OCCURRENCES, pas la premiere. Le sombre est declare DEUX fois
     (bascule manuelle + mode OS) et la palette fusionne les deux : n'abimer que
     le premier bloc laissait le second reparer la valeur, l'injection ne
     changeait rien, et la contre-epreuve annoncait une assertion muette. Le
     defaut n'etait pas dans le harnais, il etait dans l'injection — encore. */
  { nom: 'le thème sombre privé de sa couleur de texte (ses deux portes)',
    f: 'src/styles.css', de: '--texte:#F0EFE9;--texte-med:#D0CEC6', vers: '--texte:#3A3830;--texte-med:#D0CEC6', global: true },
  { nom: 'une paire gris-sur-carte ajoutée à la feuille',
    f: 'src/styles.css', ajout: '\n.mv-injection-contraste{color:#C9C6BE;background:var(--bg-card);font-size:var(--pt-micro,11px)}\n' },
  { nom: 'un fond employé comme encre, ajouté dans un module',
    f: 'src/utils.js', ajout: '\n/* injection */ var _mvInjCtr = \'color:var(--bg-card,#FBFAF6)\';\n' },
];
let injectes = 0;
if (CONTRE) {
  for (const inj of INJECTIONS) {
    if (inj.ajout) { SRC[inj.f] += inj.ajout; injectes++; continue; }
    if (!SRC[inj.f] || !SRC[inj.f].includes(inj.de)) {
      console.error('  \x1b[31m!! INJECTION MORTE\x1b[0m — ' + inj.nom
        + '\n     motif : ' + inj.de);
      continue;
    }
    SRC[inj.f] = inj.global ? SRC[inj.f].split(inj.de).join(inj.vers) : SRC[inj.f].replace(inj.de, inj.vers);
    injectes++;
  }
  if (injectes !== INJECTIONS.length) {
    console.error('\n  \x1b[31m✗ GARDE D\'INJECTION : ' + injectes + '/' + INJECTIONS.length
      + ' défauts appliqués — la contre-épreuve ne prouve rien.\x1b[0m\n');
    process.exit(1);
  }
}

/* ── La palette, lue dans styles.css ─────────────────────────────────────── */
const CSS = SRC['src/styles.css'];
function bloc(sel) {
  const i = CSS.indexOf(sel);
  if (i < 0) return '';
  const j = CSS.indexOf('{', i);
  let d = 0;
  for (let x = j; x < CSS.length; x++) {
    if (CSS[x] === '{') d++;
    else if (CSS[x] === '}') { d--; if (!d) return CSS.slice(j + 1, x); }
  }
  return '';
}
function jetons(txt) {
  const v = {};
  for (const m of txt.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) v[m[1]] = m[2].trim();
  return v;
}
/* ⚠️⚠️ TOUS LES BLOCS, PAS LE PREMIER. La palette n'est pas déclarée d'un seul
   tenant : des lots successifs ont ajouté des `:root{}` plus bas dans la
   feuille (c'est là que vivent `--or-tx`, `--orange-tx`, `--vert-tx`,
   `--acier-tx`). Ne lire que le premier bloc rendait ces jetons INCONNUS —
   toute règle qui les emploie tombait dans « non résoluble », c'est-à-dire
   hors mesure, en silence. Un harnais qui ne voit pas un jeton ne signale pas
   son absence : il signale une couverture plus faible, et on ne la regarde que
   si elle est affichée. C'est pour ça qu'elle l'est. */
/* ⚠️ Deux pièges, tombés dedans tous les deux à l'écriture :
   · LES COMMENTAIRES. La feuille EXPLIQUE la cascade des thèmes en prose, et
     ces explications citent `:root`. Un `:root` en commentaire faisait ouvrir
     le bloc `{` SUIVANT — celui du thème sombre — et la palette CLAIRE
     absorbait les valeurs SOMBRES. Les deux thèmes devenaient identiques, et
     tout se mesurait deux fois dans le mauvais. On blanchit d'abord.
   · LA FENÊTRE D'EXCLUSION. En regardant 90 caractères après le sélecteur, un
     bloc clair d'une seule ligne suivi du bloc sombre à la ligne d'en dessous
     était pris pour du sombre et EXCLU. C'est ce qui rendait `--or-tx`,
     `--vert-tx`, `--orange-tx`, `--acier-tx` invisibles. On ne lit désormais
     que le SÉLECTEUR, c'est-à-dire ce qui précède l'accolade. */
const CSS_NU = CSS.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
function tousLesBlocs(motif, exclure) {
  const out = {};
  const rx = new RegExp(motif, 'g');
  let m;
  while ((m = rx.exec(CSS_NU))) {
    const j = CSS_NU.indexOf('{', m.index);
    if (j < 0) continue;
    const selecteur = CSS_NU.slice(m.index, j);
    if (exclure && exclure.test(selecteur)) continue;
    let d = 0;
    for (let x = j; x < CSS_NU.length; x++) {
      if (CSS_NU[x] === '{') d++;
      else if (CSS_NU[x] === '}') { d--; if (!d) { Object.assign(out, jetons(CSS_NU.slice(j + 1, x))); break; } }
    }
  }
  return out;
}
/* Le sombre a DEUX portes : le bascule manuel `[data-theme="dark"]` et le mode
   OS `@media(prefers-color-scheme:dark)`, dont le sélecteur est
   `:root:not([data-theme="light"])`. Les deux sont du sombre. */
const CLAIR  = tousLesBlocs(':root(?![\\w-])', /data-theme\s*=\s*"(dark)"|:not\(\s*\[data-theme\s*=\s*"light"/);
const SOMBRE = Object.assign({}, CLAIR,
  tousLesBlocs('\\[data-theme\\s*=\\s*"dark"\\]'),
  tousLesBlocs(':root:not\\(\\s*\\[data-theme\\s*=\\s*"light"'));

/* ── Couleurs : résolution, composition, ratio ───────────────────────────── */
const NOMMEES = { white: '#FFFFFF', black: '#000000' };
function resoudre(v, T, prof) {
  prof = prof || 0;
  if (prof > 6 || !v) return null;
  v = String(v).trim().replace(/!important$/, '').trim();
  const mv = v.match(/^var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([\s\S]+?)\s*)?\)$/);
  if (mv) {
    if (Object.prototype.hasOwnProperty.call(T, mv[1])) return resoudre(T[mv[1]], T, prof + 1);
    return mv[2] ? resoudre(mv[2], T, prof + 1) : null;
  }
  if (NOMMEES[v.toLowerCase()]) v = NOMMEES[v.toLowerCase()];
  const mh = v.match(/^#([0-9A-Fa-f]{3,8})$/);
  if (mh) {
    let h = mh[1];
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    if (h.length === 6) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
    if (h.length === 8) return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), parseInt(h.slice(6, 8), 16) / 255];
    return null;
  }
  const mr = v.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)\s*(?:,\s*([0-9.]+)\s*)?\)$/);
  if (mr) return [+mr[1], +mr[2], +mr[3], mr[4] === undefined ? 1 : +mr[4]];
  return null;   /* dégradé, currentColor, inherit… : non résoluble, et on le dira */
}
const poser = (fg, bg) => [0, 1, 2].map(i => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat([1]);
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
function ratio(a, b) {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/* Un jeton NOMMÉ pale/bg dit où il vit : sur la carte. Un rgba anonyme, non. */
const jetonPose = v => /^var\(\s*--[a-z0-9-]*(?:pale|bg)\b/i.test(String(v).trim());

function mesurer(couleur, fond, T) {
  const cf = resoudre(couleur, T), bf = resoudre(fond, T);
  if (!cf || !bf) return { etat: 'non-resoluble' };
  let bg;
  if (bf[3] < 1) {
    if (!jetonPose(fond)) return { etat: 'fond-inconnu' };
    const surface = resoudre('var(--bg-card)', T);
    if (!surface) return { etat: 'fond-inconnu' };
    bg = poser(bf, surface);
  } else bg = bf;
  const fg = cf[3] < 1 ? poser(cf, bg) : cf;
  return { etat: 'mesure', r: ratio(fg, bg) };
}

/* ── 1. Les paires DÉCLARÉES par les noms de jetons ──────────────────────── */
function famillesDeclarees(T) {
  const out = [];
  for (const k of Object.keys(T)) {
    let m = k.match(/^--tag-([a-z0-9]+)-bg$/);
    if (m && T['--tag-' + m[1] + '-tx']) {
      out.push({ nom: 'tag-' + m[1], tx: 'var(--tag-' + m[1] + '-tx)', bg: 'var(--tag-' + m[1] + '-bg)' });
      continue;
    }
    m = k.match(/^(--[a-z0-9-]+)-pale$/);
    if (m && T[m[1]]) {
      /* ★ L'ENCRE DECLAREE POUR UNE PASTILLE `--X-pale`, C'EST `--X-tx` QUAND IL
         EXISTE — pas `--X`. La convention de nommage le dit, et le code le fait
         depuis CONTRASTE-2. Mesurer `--X` ici reviendrait a noter une paire que
         plus personne n'ecrit, et a laisser croire a une faute reparee. */
      const encre = T[m[1] + '-tx'] ? m[1] + '-tx' : m[1];
      out.push({ nom: encre.slice(2) + ' / ' + k.slice(2), tx: 'var(' + encre + ')', bg: 'var(' + k + ')' });
    }
  }
  return out.sort((a, b) => a.nom.localeCompare(b.nom));
}

/* ── 2. Les paires ÉCRITES dans le code ──────────────────────────────────── */
const RX_COL  = /(?<![-a-z])color\s*:\s*([^;"'}]+)/i;
const RX_FOND = /background(?:-color)?\s*:\s*([^;"'}]+)/i;
const RX_TAIL = /font-size\s*:\s*(?:var\(--pt-[a-z]+,)?([0-9.]+)px/i;
const RX_GRAS = /font-weight\s*:\s*([0-9]+|bold)/i;

/* ⚠️⚠️ UNE REGLE PORTEE PAR UN THEME NE SE MESURE QUE DANS CE THEME.
   Sans ca, `#app-root[data-theme="dark"] .x{color:#F0EFE9;background:#1C1A16}`
   ressort a 1,07 « en clair » — un chiffre faux sur une regle que le theme
   clair n'applique jamais. C'est ce qui faisait remonter `body` et les blocs
   sombres dans les pires ecarts au premier jet. */
function porteeDe(avant) {
  const q = avant.slice(-220);
  if (/prefers-color-scheme\s*:\s*dark/.test(q)) return 'sombre';
  if (/\[data-theme\s*=\s*["']?dark/.test(q)) return 'sombre';
  if (/\[data-theme\s*=\s*["']?light/.test(q)) return 'clair';
  if (/:not\(\s*\[data-theme\s*=\s*["']?dark/.test(q)) return 'clair';
  return 'les-deux';
}
function zonesDe(t) {
  const out = [];
  for (const m of t.matchAll(/\{([^{}]{0,900})\}/g))
    out.push({ z: m[1], portee: porteeDe(t.slice(0, m.index)) });
  for (const m of t.matchAll(/style="([^"]{0,900})"/g))   out.push({ z: m[1], portee: 'les-deux' });
  for (const m of t.matchAll(/style='([^']{0,900})'/g))   out.push({ z: m[1], portee: 'les-deux' });
  return out;
}
function balayer(T, nomTheme) {
  const res = { mesurees: 0, nonResoluble: 0, fondInconnu: 0, sous: {}, detail: [] };
  for (const f of FICHIERS) {
    for (const zone of zonesDe(SRC[f])) {
      const z = zone.z;
      if (zone.portee !== 'les-deux' && zone.portee !== nomTheme) continue;
      const c = RX_COL.exec(z), b = RX_FOND.exec(z);
      if (!c || !b) continue;
      const m = mesurer(c[1].trim(), b[1].trim(), T);
      if (m.etat === 'non-resoluble') { res.nonResoluble++; continue; }
      if (m.etat === 'fond-inconnu')  { res.fondInconnu++; continue; }
      res.mesurees++;
      const mt = RX_TAIL.exec(z), mg = RX_GRAS.exec(z);
      const px = mt ? parseFloat(mt[1]) : 0;
      const gras = !!mg && (mg[1] === 'bold' || parseInt(mg[1], 10) >= 700);
      const seuil = (px >= 24 || (px >= 18.5 && gras)) ? AA_GRAND : AA_NORMAL;
      if (m.r < seuil) {
        res.sous[f] = (res.sous[f] || 0) + 1;
        res.detail.push({ f, tx: c[1].trim().slice(0, 30), bg: b[1].trim().slice(0, 30), r: +m.r.toFixed(2), seuil });
      }
    }
  }
  return res;
}

/* ── 3. Un jeton de SURFACE employé comme couleur de TEXTE ───────────────── */
/* ★★★ LA CLASSE DE DÉFAUT QUE CE HARNAIS A TROUVÉE LE JOUR OÙ IL A ÉTÉ ÉCRIT.
   `--cave` est le fond du chai. En thème clair il vaut #14110D — une encre
   presque noire — donc `color:var(--cave)` sur une carte crème donne 18:1 et
   personne n'a rien vu. En thème sombre le MÊME jeton vaut #100D0A et la carte
   #1C1A16 : 1,12. Trente et un titres invisibles, dans six modules.
   ⚠️ Le remède n'est PAS un remplacement en masse : une bonne moitié de ces
   trente et un sont posés sur un fond FIXE (#fff, #FDF7EE, un badge doré) qui
   ne suit pas le thème — là, l'encre sombre est juste. Chaque site demande de
   savoir si son fond suit le thème ou non. D'où un cliquet, pas une correction
   automatique : la liste de travail est exacte, et aucun nouveau ne peut
   entrer. */
const SURFACES = ['--cave', '--cave-2', '--bg-app', '--bg-card', '--blanc', '--gris', '--gris-clair'];
function surfacesEnTexte() {
  const par = {};
  const rx = new RegExp('(?<![-a-z])color\\s*:\\s*var\\(\\s*(' + SURFACES.join('|') + ')\\b', 'g');
  for (const f of FICHIERS) {
    const n = (SRC[f].match(rx) || []).length;
    if (n) par[f] = n;
  }
  return par;
}

/* ── Mesure ──────────────────────────────────────────────────────────────── */
const THEMES = [['clair', CLAIR], ['sombre', SOMBRE]];
const etat = { familles: {}, code: {} };
for (const [nom, T] of THEMES) {
  const fam = {};
  for (const p of famillesDeclarees(T)) {
    const m = mesurer(p.tx, p.bg, T);
    if (m.etat === 'mesure' && m.r < AA_NORMAL) fam[p.nom] = +m.r.toFixed(2);
  }
  etat.familles[nom] = fam;
  const b = balayer(T, nom);
  etat.code[nom] = { mesurees: b.mesurees, nonResoluble: b.nonResoluble, fondInconnu: b.fondInconnu, sous: b.sous };
  etat.code[nom].__detail = b.detail;
}

etat.surfaces = surfacesEnTexte();

if (REGRAVE) {
  const aEcrire = JSON.parse(JSON.stringify(etat));
  for (const t of ['clair', 'sombre']) delete aEcrire.code[t].__detail;
  fs.writeFileSync(BASE, JSON.stringify(aEcrire, null, 2) + '\n', 'utf8');
  console.log('\n  cliquet du contraste regravé\n');
  process.exit(0);
}
const REF = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : { familles: {}, code: {} };

/* ── Verdict ─────────────────────────────────────────────────────────────── */
let ok = 0, ko = 0, gains = [];
const t = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail ? '\n      → ' + detail : '')); }
};

console.log('\n── LE CONTRASTE, DANS LES DEUX THÈMES — lot CONTRASTE-1\n');

/* ★★★ LES DEUX PORTES DU THEME SOMBRE PORTENT LES MEMES JETONS.
   Il y en a deux : la bascule manuelle `[data-theme="dark"]` et le mode OS
   `@media(prefers-color-scheme:dark)` (selecteur `:not([data-theme="light"])`).
   Un jeton ajoute a l'une et oublie a l'autre garde sa valeur CLAIRE chez tous
   les gens qui n'ont jamais touche le bouton de theme — c'est-a-dire la
   plupart. Une encre sombre sur une pastille sombre, et rien pour le dire.
   L'invariant tient aujourd'hui (64 = 64) : cette assertion existe pour le
   jour ou un lot n'ajoutera la ligne qu'a un seul des trois blocs. */
function jetonsDe(selOk) {
  const out = new Set();
  const rx = /:root(?![\w-])|#app-root(?![\w-])/g;
  let m;
  while ((m = rx.exec(CSS_NU))) {
    const j = CSS_NU.indexOf('{', m.index);
    if (j < 0 || !selOk(CSS_NU.slice(m.index, j))) continue;
    let d = 0;
    for (let x = j; x < CSS_NU.length; x++) {
      if (CSS_NU[x] === '{') d++;
      else if (CSS_NU[x] === '}') {
        d--;
        if (!d) { for (const k of CSS_NU.slice(j + 1, x).matchAll(/(--[a-z0-9-]+)\s*:/g)) out.add(k[1]); break; }
      }
    }
  }
  return out;
}
{
  const manuel = jetonsDe(s => /\[data-theme\s*=\s*"dark"\]/.test(s));
  const auto   = jetonsDe(s => /:not\(\s*\[data-theme\s*=\s*"light"/.test(s));
  const oublies = [...manuel].filter(k => !auto.has(k)).sort();
  t('les deux portes du thème sombre portent les mêmes jetons ('
    + manuel.size + ' / ' + auto.size + ')',
    oublies.length === 0,
    oublies.join(' · ') + '\n        oublié en mode OS = valeur CLAIRE chez qui n\'a jamais touché le bouton');
}

t('la palette se lit : ' + Object.keys(CLAIR).length + ' jetons en clair, '
  + Object.keys(SOMBRE).length + ' en sombre',
  Object.keys(CLAIR).length > 40 && SOMBRE['--texte'] !== CLAIR['--texte'],
  'sans les deux thèmes, ce harnais ne mesure que la moitié de l\'application');

for (const [nom] of THEMES) {
  const cour = etat.familles[nom] || {}, ref = (REF.familles || {})[nom] || {};
  const neuves = Object.keys(cour).filter(k => !(k in ref));
  const pires  = Object.keys(cour).filter(k => k in ref && cour[k] < ref[k] - 0.01);
  const fixes  = Object.keys(ref).filter(k => !(k in cour));
  fixes.forEach(k => gains.push('famille ' + k + ' (' + nom + ') repasse au-dessus de 4,5'));
  t('thème ' + nom + ' : aucune famille de jetons ne passe sous 4,5 (' + Object.keys(cour).length + ' déjà connues)',
    neuves.length === 0 && pires.length === 0,
    [].concat(neuves.map(k => k + ' ' + cour[k] + ' (NOUVELLE)'),
              pires.map(k => k + ' ' + ref[k] + '→' + cour[k])).join(' · '));
}

{
  const cour = etat.surfaces, ref = REF.surfaces || {};
  const hausses = Object.keys(cour).filter(f => cour[f] > (ref[f] || 0))
    .map(f => f + ' ' + (ref[f] || 0) + '→' + cour[f]);
  const tot = Object.values(cour).reduce((s, x) => s + x, 0);
  const refTot = Object.values(ref).reduce((s, x) => s + x, 0);
  if (Object.keys(ref).length && tot < refTot) gains.push((refTot - tot) + ' jeton(s) de surface de moins en couleur de texte');
  t('aucun jeton de surface neuf en couleur de texte (' + tot + ' connus)',
    hausses.length === 0,
    hausses.join(' · ') + '\n        un fond employe comme encre est juste dans un theme et invisible dans l\'autre');
}

for (const [nom] of THEMES) {
  const c = etat.code[nom], r = (REF.code || {})[nom] || {};
  const hausses = Object.keys(c.sous).filter(f => c.sous[f] > (r.sous ? (r.sous[f] || 0) : 0))
    .map(f => f + ' ' + ((r.sous && r.sous[f]) || 0) + '→' + c.sous[f]);
  const tot = Object.values(c.sous).reduce((s, x) => s + x, 0);
  const refTot = r.sous ? Object.values(r.sous).reduce((s, x) => s + x, 0) : null;
  if (refTot !== null && tot < refTot) gains.push('thème ' + nom + ' : ' + (refTot - tot) + ' écart(s) de moins dans le code');
  t('thème ' + nom + ' : le nombre d\'écarts ne monte dans aucun fichier (' + tot + ')',
    hausses.length === 0, hausses.join(' · '));
  /* ★ La couverture est une mesure, pas un détail : si elle chute, le harnais
     mesure moins tout en restant vert — c'est la panne la plus silencieuse
     qu'un contrôle puisse avoir. */
  t('thème ' + nom + ' : la couverture ne baisse pas (' + c.mesurees + ' paires mesurées)',
    r.mesurees === undefined || c.mesurees >= r.mesurees,
    r.mesurees + ' → ' + c.mesurees);
}

/* ── Le tableau ──────────────────────────────────────────────────────────── */
for (const [nom] of THEMES) {
  const c = etat.code[nom], fam = etat.familles[nom];
  console.log('\n  ── ' + nom.toUpperCase() + ' — ' + c.mesurees + ' paires mesurées · '
    + c.fondInconnu + ' au fond inconnu · ' + c.nonResoluble + ' non résolubles');
  const fk = Object.keys(fam);
  if (fk.length) {
    console.log('     familles sous 4,5 : '
      + fk.map(k => k + ' ' + fam[k].toFixed(2)).join(' · '));
  }
  const pires = c.__detail.slice().sort((a, b) => a.r - b.r).slice(0, 5);
  for (const d of pires) {
    console.log('     ' + d.f.split('/').pop().padEnd(16) + d.tx.padEnd(28)
      + ' / ' + d.bg.padEnd(24) + ' ' + d.r.toFixed(2) + ' < ' + d.seuil);
  }
}
if (gains.length) {
  console.log('\n  \x1b[32mprogrès depuis le cliquet :\x1b[0m');
  gains.forEach(g => console.log('     · ' + g));
  console.log('     → regraver : node scripts/mv-harnais-contraste.mjs --baseline');
}

console.log('\n  ' + ok + ' vertes, ' + ko + ' rouges'
  + (CONTRE ? '  (contre-épreuve : ' + injectes + '/' + INJECTIONS.length + ' défauts injectés)' : '') + '\n');

if (CONTRE) {
  if (ko === 0) {
    console.error('  \x1b[31m✗ CONTRE-ÉPREUVE : tout est vert avec ' + injectes
      + ' défauts en place — le harnais ne mord pas.\x1b[0m\n');
    process.exit(1);
  }
  console.log('  \x1b[32m✓ contre-épreuve : ' + ko + ' assertions rougissent sur '
    + injectes + ' défauts.\x1b[0m\n');
  process.exit(0);
}
process.exit(ko ? 1 : 0);
