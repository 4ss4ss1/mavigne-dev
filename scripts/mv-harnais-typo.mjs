/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LE BAREME TYPOGRAPHIQUE ET LE POIDS DES MODULES (lot TYPO-1)
   Lancer : node scripts/mv-harnais-typo.mjs
            node scripts/mv-harnais-typo.mjs --contre
            node scripts/mv-harnais-typo.mjs --baseline   (regraver le cliquet)

   ══ POURQUOI ══
   Le bareme --pt-* existe depuis DS-0. Il etait applique dans DEUX modules
   (pilotage.js : 229 jetons, ZERO px en dur ; cave.js : 501) et dans AUCUN
   des neuf autres : admin-gt.js 473 px en dur / 0 jeton, index.html 408 / 0,
   reglages.js 327 / 0, app.js 299 / 0, planning.js 278 / 0. 82 % des tailles
   de texte de l'application etaient ecrites en dur.

   ★★★ CE N'EST PAS UN SUJET DE PROPRETE, C'EST CE QUI BLOQUE LE REGLAGE
   « TAILLE DU TEXTE ». Un cran d'accessibilite se pose en une ligne dans
   :root — a condition que l'ecran lise :root. Tant que 82 % des tailles sont
   ecrites en dur, le reglage ne deplacerait que 18 % de l'ecran, ce qui est
   pire que pas de reglage du tout : l'utilisateur croit avoir agrandi.

   Ce qu'il interdit :
     A. qu'une taille EXACTEMENT egale a un cran du bareme soit ecrite en dur
        — c'est la regle qui garde l'acquis : un `font-size:11px` ecrit demain
        rougit le jour meme, la ou un simple cliquet l'aurait laisse passer
        contre une conversion faite ailleurs ;
     B. qu'un `var(--pt-*)` parte SANS SON REPLI dans src/*.js. Dix modules
        construisent des fenetres d'impression, ou :root n'existe pas : le
        jeton n'y resout rien et la taille tombe a l'heritage. Meme famille
        que _mvIcon vs _mvIconInline (harnais des icones, regle F) ;
     C. que le compte de px en dur REMONTE, fichier par fichier ;
     D. que le trop-petit (< 12 px) regagne du terrain ;
     E. qu'un module enfle sans que personne ne se pose la question du
        decoupage — plafond dur, et tolerance de croissance par lot.

   ⚠️ §34g : on lit le CODE. Le bareme lui-meme (:root) est exclu du comptage,
      sinon il se compterait comme onze fautes.
   ⚠️ §25.2 : la contre-epreuve injecte EN MEMOIRE, avec garde d'injection.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const BASE   = path.join(ICI, 'typo-baseline.json');
const CONTRE  = process.argv.includes('--contre');
const REGRAVE = process.argv.includes('--baseline');

/* Le bareme, tel que DS-0 l'a pose. Ecrit ici pour que le harnais puisse
   VERIFIER styles.css au lieu de lui faire confiance. */
const BAREME = {
  '--pt-hero': 40, '--pt-xxl': 31, '--pt-xl': 27, '--pt-lg': 23, '--pt-md': 20,
  '--pt-sm': 17, '--pt-base': 14, '--pt-txt': 12.5, '--pt-micro': 11,
  '--pt-lbl': 10.5, '--pt-nano': 9.5
};
const PLANCHER = 12;          /* en-dessous, c'est du trop-petit */
const PLAFOND_KO = 1024;      /* poids d'un module : au-dela, on decoupe */
const TOLERANCE = 1.05;       /* +5 % par lot sans regraver : au-dela, on se pose la question */

const FICHIERS = fs.readdirSync(path.join(RACINE, 'src'))
  .filter(f => f.endsWith('.js')).sort().map(f => 'src/' + f)
  .concat(['index.html', 'src/styles.css']);

const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');

let SRC = {};
for (const f of FICHIERS) SRC[f] = lire(f);

/* ── Injections de la contre-epreuve ─────────────────────────────────────── */
const INJECTIONS = [
  { nom: 'une taille exacte du bareme reecrite en dur',
    f: 'src/app.js', de: 'font-size:var(--pt-micro,11px)', vers: 'font-size:11px' },
  { nom: 'un jeton sans son repli dans un module',
    f: 'src/cave.js', de: 'font-size:var(--pt-nano,9.5px)', vers: 'font-size:var(--pt-nano)' },
  { nom: 'du trop-petit ajoute',
    f: 'src/reglages.js', de: 'font-size:var(--pt-base,14px)', vers: 'font-size:8px' },
  { nom: 'un cran du bareme retire de :root',
    f: 'src/styles.css', de: '--pt-nano:9.5px;', vers: '' },
];
let injectes = 0;
if (CONTRE) {
  for (const inj of INJECTIONS) {
    if (!SRC[inj.f] || !SRC[inj.f].includes(inj.de)) {
      console.error('  \x1b[31m!! INJECTION MORTE\x1b[0m — ' + inj.nom); continue;
    }
    SRC[inj.f] = SRC[inj.f].replace(inj.de, inj.vers);
    injectes++;
  }
  if (injectes !== INJECTIONS.length) {
    console.error('\n  \x1b[31m✗ GARDE D\'INJECTION : ' + injectes + '/' + INJECTIONS.length
      + ' defauts appliques — la contre-epreuve ne prouve rien.\x1b[0m\n');
    process.exit(1);
  }
}

/* ── Comptage ────────────────────────────────────────────────────────────── */
/* Le bareme lui-meme n'est pas une faute : on masque le bloc :root. */
function sansRacine(f, t) {
  if (f !== 'src/styles.css') return t;
  const i = t.indexOf(':root');
  if (i < 0) return t;
  const j = t.indexOf('}', i);
  return t.slice(0, i) + ' '.repeat(j - i + 1) + t.slice(j + 1);
}
const RX_DUR    = /font-size\s*:\s*([0-9]+(?:\.[0-9]+)?)px/g;
const RX_JETON  = /var\(\s*(--pt-[a-z0-9]+)\s*(,[^)]*)?\)/g;
const crans = new Set(Object.values(BAREME));

const mesure = {};
let exactsEnDur = [], sansRepli = [];
for (const f of FICHIERS) {
  const brut = SRC[f], corps = sansRacine(f, brut);
  let dur = 0, petit = 0, m;
  RX_DUR.lastIndex = 0;
  while ((m = RX_DUR.exec(corps))) {
    const px = parseFloat(m[1]);
    dur++;
    if (px < PLANCHER) petit++;
    if (crans.has(px)) exactsEnDur.push(f + ' : ' + px + 'px');
  }
  RX_JETON.lastIndex = 0;
  while ((m = RX_JETON.exec(brut))) {
    if (!m[2] && f.startsWith('src/') && f.endsWith('.js')) sansRepli.push(f + ' : var(' + m[1] + ')');
  }
  mesure[f] = { dur, petit, ko: Math.round(fs.statSync(path.join(RACINE, f)).size / 1024) };
}

/* ── Regravage ───────────────────────────────────────────────────────────── */
if (REGRAVE) {
  fs.writeFileSync(BASE, JSON.stringify(mesure, null, 2) + '\n', 'utf8');
  console.log('\n  cliquet regrave : ' + FICHIERS.length + ' fichiers\n');
  process.exit(0);
}
const REF = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : {};

/* ── Verdict ─────────────────────────────────────────────────────────────── */
let ok = 0, ko = 0;
const t = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail ? '\n      → ' + detail : '')); }
};

console.log('\n── LE BAREME TYPOGRAPHIQUE — lot TYPO-1\n');

/* A. le bareme existe, et il est celui qu'on croit */
const CSS = SRC['src/styles.css'];
const manquants = Object.keys(BAREME).filter(k => {
  const m = CSS.match(new RegExp(k.replace(/-/g, '\\-') + '\\s*:\\s*([0-9.]+)px'));
  return !m || parseFloat(m[1]) !== BAREME[k];
});
t('les ' + Object.keys(BAREME).length + ' crans du bareme sont dans :root, aux bonnes valeurs',
  manquants.length === 0, manquants.join(', '));

/* B. aucune taille exacte du bareme ecrite en dur */
t('aucune taille egale a un cran n\'est ecrite en dur (' + exactsEnDur.length + ')',
  exactsEnDur.length === 0,
  exactsEnDur.slice(0, 6).join(' · ') + (exactsEnDur.length > 6 ? ' …' : ''));

/* C. le repli, sans exception, dans les modules */
t('tout var(--pt-*) de src/*.js porte son repli (' + sansRepli.length + ' nu(s))',
  sansRepli.length === 0,
  sansRepli.slice(0, 6).join(' · ') + '\n        dix modules construisent des fenetres d\'impression : :root n\'y existe pas');

/* D. les cliquets par fichier */
let hausseDur = [], haussePetit = [], troplourd = [], enfle = [];
for (const f of FICHIERS) {
  const m = mesure[f], r = REF[f];
  if (!r) continue;                     /* fichier neuf : rien a comparer */
  if (m.dur   > r.dur)   hausseDur.push(f + ' ' + r.dur + '→' + m.dur);
  if (m.petit > r.petit) haussePetit.push(f + ' ' + r.petit + '→' + m.petit);
  if (m.ko    > r.ko * TOLERANCE) enfle.push(f + ' ' + r.ko + '→' + m.ko + ' ko');
  if (m.ko    > PLAFOND_KO) troplourd.push(f + ' ' + m.ko + ' ko');
}
const totDur   = Object.values(mesure).reduce((s, x) => s + x.dur, 0);
const totPetit = Object.values(mesure).reduce((s, x) => s + x.petit, 0);
const refDur   = Object.values(REF).reduce((s, x) => s + x.dur, 0);

t('le px en dur ne remonte dans aucun fichier (' + totDur + ' au total)',
  hausseDur.length === 0, hausseDur.join(' · '));
t('le trop-petit (< ' + PLANCHER + ' px) ne regagne pas de terrain (' + totPetit + ')',
  haussePetit.length === 0, haussePetit.join(' · '));
t('aucun module ne depasse ' + PLAFOND_KO + ' ko',
  troplourd.length === 0, troplourd.join(' · ') + '\n        au-dela, la question n\'est plus « comment l\'editer » mais « ou le couper »');
t('aucun module n\'enfle de plus de ' + Math.round((TOLERANCE - 1) * 100) + ' % en un lot',
  enfle.length === 0, enfle.join(' · ') + '\n        regraver avec --baseline, apres s\'etre pose la question du decoupage');

/* ── Le tableau, pour l'oeil ─────────────────────────────────────────────── */
console.log('\n  fichier                px en dur   dont < ' + PLANCHER + '     ko');
for (const f of FICHIERS) {
  const m = mesure[f];
  if (!m.dur && !m.ko) continue;
  console.log('  ' + f.padEnd(24) + String(m.dur).padStart(6)
    + String(m.petit).padStart(11) + String(m.ko).padStart(8));
}
if (refDur) {
  const d = refDur - totDur;
  console.log('\n  px en dur : ' + totDur + (d ? '  (' + (d > 0 ? '−' + d : '+' + (-d)) + ' depuis le cliquet)' : ''));
}

console.log('\n  ' + ok + ' vertes, ' + ko + ' rouges'
  + (CONTRE ? '  (contre-epreuve : ' + injectes + '/' + INJECTIONS.length + ' defauts injectes)' : '') + '\n');

if (CONTRE) {
  if (ko === 0) {
    console.error('  \x1b[31m✗ CONTRE-EPREUVE : tout est vert avec ' + injectes
      + ' defauts en place — le harnais ne mord pas.\x1b[0m\n');
    process.exit(1);
  }
  console.log('  \x1b[32m✓ contre-epreuve : ' + ko + ' assertions rougissent sur '
    + injectes + ' defauts.\x1b[0m\n');
  process.exit(0);
}
process.exit(ko ? 1 : 0);
