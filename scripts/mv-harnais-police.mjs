#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LA POLICE PASSE PAR LA CHARTE (lot CHARTE-1, §367)
   Lancer :  node scripts/mv-harnais-police.mjs
             node scripts/mv-harnais-police.mjs --contre

   ══ POURQUOI ══
   Nico (19/10) : « chaque fois que j'essaie de changer le style des modules, la police, la mise en page,
   on doit tout changer module par module ». Mesuré sur `d741866` : les deux réglages existaient depuis
   DS-4 (--font-ui, --font-titre, en tête de styles.css) et servaient 94 fois — mais la police était
   écrite EN TOUTES LETTRES 765 fois (325 dans styles.css, 440 dans les modules, index.html, les pages
   GT et boot.js). Changer de police = 765 retouches. Depuis CHARTE-1 : une ligne, le réglage.
   Ce harnais tient l'acquis : un `font-family:'Outfit'` écrit demain rougit le jour même.

   Ce qu'il interdit :
     A. qu'une police (Outfit, Cormorant) soit écrite en toutes lettres hors de trois endroits :
        la définition du réglage dans styles.css, le REPLI d'un var(--font-ui,…) / var(--font-titre,…),
        et une exemption écrite ci-dessous AVEC SA RAISON (une exception se décide, elle ne se glisse pas) ;
     B. qu'un repli mente sur son rôle : Cormorant derrière --font-ui, Outfit derrière --font-titre ;
     C. qu'un var(--font-*) parte SANS REPLI hors de styles.css : les fenêtres d'impression, l'écran de
        démarrage d'index.html et boot.js n'ont pas la feuille — le réglage n'y existe pas, et la police
        tomberait à celle du navigateur (même règle que les --pt-*, mv-harnais-typo C) ;
     D. que le réglage disparaisse, ou soit déclaré deux fois (deux vérités pour une police) ;
     E. que la police d'un réglage n'ait pas ses fichiers dans public/fonts/fonts.css : chaque téléphone
        prendrait une police de secours, sans le dire. Une famille générique (system-ui, serif…) n'en
        demande pas ;
     F. que --sans revienne : déclaré nulle part, il tombait toujours sur son repli — un second nom pour
        la même chose, la faute de --bordeaux (TOUR-1).
     G. qu'une exemption ne serve plus : elle se retire avec ce qu'elle couvrait, sinon la liste enfle.

   ⚠️ CE QU'IL NE FAIT PAS : regarder un écran. Il garde la règle ; le rendu se regarde (§24).
   ⚠️ Les commentaires ne comptent pas (§25, « les commentaires ne sont pas une preuve ») : les lignes
      de commentaire et les blocs ouverts en tête de ligne dans les JS, tous les commentaires de la
      feuille, les commentaires HTML des pages. Jamais de retrait global des blocs sur un JS ou une page :
      l'attribut accept d'un champ photo (« image/ » suivi d'une étoile) en ouvrirait un faux, jusqu'à la
      fin du bloc suivant — et tout ce qui est entre les deux échapperait au contrôle.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const CONTRE = process.argv.includes('--contre');

const FEUILLE = 'src/styles.css';
const CHARTE = 'src/charte.css';   // ★ CHARTE-2 (§368) : le réglage se déclare ici, et nulle part ailleurs
const POLICES = 'public/fonts/fonts.css';
const FICHIERS = [
  ...fs.readdirSync(path.join(RACINE, 'src')).filter(f => f.endsWith('.js')).sort().map(f => 'src/' + f),
  CHARTE, FEUILLE, 'index.html',
  ...fs.readdirSync(path.join(RACINE, 'src', 'gt')).filter(f => f.endsWith('.html')).sort().map(f => 'src/gt/' + f),
  'public/boot.js'
];
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');

/* ══ EXEMPTIONS — chacune porte SA RAISON, et son compte exact ═══════════════
   `extrait` est un morceau de LA LIGNE qui porte le nom ; `n` le nombre de noms qu'elle couvre. */
const EXEMPTIONS = [
  { fichier: 'src/whats-new.js', extrait: 'ni Cormorant ni Outfit ne', n: 2,
    raison: 'texte affiché (une fiche qui raconte l’espace fine des nombres) : il parle des polices, il n’en pose aucune' },
  { fichier: 'src/whats-new.js', extrait: 'passent en Cormorant', n: 1,
    raison: 'texte d’une annonce (WHATS_NEW) : il nomme la police, il ne la pose pas' },
  { fichier: 'src/cockpit-vue.js', extrait: "return POLICE_UI || 'Outfit, system-ui, sans-serif';", n: 1,
    raison: 'une toile (canvas) ne lit pas les variables CSS : policeUi() lit --font-ui au premier dessin ; '
          + 'ce repli ne sert que si la feuille n’est pas encore appliquée' }
];
const GENERIQUES = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif',
                    'ui-serif', 'ui-monospace', 'ui-rounded', '-apple-system', 'blinkmacsystemfont'];

/* ══ Outils ═══════════════════════════════════════════════════════════════ */
function zonesCommentaires(f, s) {
  const z = [];
  const pousse = (re, src = s, decal = 0) => { for (const m of src.matchAll(re)) z.push([decal + m.index, decal + m.index + m[0].length]); };
  if (f.endsWith('.css')) pousse(/\/\*[\s\S]*?\*\//g);
  else if (f.endsWith('.html')) {
    pousse(/<!--[\s\S]*?-->/g);
    for (const st of s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
      const debut = st.index + st[0].indexOf(st[1]);
      pousse(/\/\*[\s\S]*?\*\//g, st[1], debut);
    }
  } else {
    pousse(/^[ \t]*(?:\/\/|\/\*|\*).*$/gm);
    pousse(/^[ \t]*\/\*[\s\S]*?\*\//gm);
  }
  return z;
}
const dans = (z, i) => z.some(([a, b]) => a <= i && i < b);
const ligneDe = (s, i) => s.slice(0, i).split('\n').length;
const ligneTexte = (s, i) => { const a = s.lastIndexOf('\n', i) + 1, b = s.indexOf('\n', i); return s.slice(a, b < 0 ? s.length : b); };
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

/* ══ LA VÉRIFICATION — sur des sources passées en argument (les contre-épreuves les mutent) ═══ */
function verifier(SRC) {
  const fautes = { A: [], B: [], C: [], D: [], E: [], F: [], G: [] };
  const vus = { definitions: 0, replis: 0, exemptes: 0, noms: 0 };
  const exemptCompte = EXEMPTIONS.map(() => 0);

  for (const f of FICHIERS) {
    const s = SRC[f]; if (s == null) continue;
    const z = zonesCommentaires(f, s);
    for (const m of s.matchAll(/\b(Outfit|Cormorant)\b/g)) {
      if (dans(z, m.index)) continue;
      vus.noms++;
      const avant = s.slice(Math.max(0, m.index - 200), m.index);
      /* (a) la définition du réglage, dans la feuille seulement */
      if (f === CHARTE && /--font-(?:ui|titre|code)\s*:[^;{}]*$/.test(avant)) { vus.definitions++; continue; }
      /* (b) le repli d'un var(--font-ui|titre, …) — rien entre les deux qui ouvre ou ferme une parenthèse */
      const r = avant.match(/var\(\s*(--font-(?:ui|titre))\s*,[^()]*$/);
      if (r) {
        vus.replis++;
        const attendu = m[1] === 'Outfit' ? '--font-ui' : '--font-titre';
        if (r[1] !== attendu) fautes.B.push(f + ':' + ligneDe(s, m.index) + ' ' + m[1] + ' derrière ' + r[1]);
        continue;
      }
      /* (c) une exemption, avec sa raison */
      const ligne = ligneTexte(s, m.index);
      const k = EXEMPTIONS.findIndex(e => e.fichier === f && ligne.includes(e.extrait));
      if (k >= 0) { exemptCompte[k]++; vus.exemptes++; continue; }
      fautes.A.push(f + ':' + ligneDe(s, m.index) + ' « ' + ligne.trim().slice(Math.max(0, ligne.trim().indexOf(m[1]) - 50), ligne.trim().indexOf(m[1]) + 40) + ' »');
    }
    /* C. le repli, hors de la feuille */
    if (f !== FEUILLE && f !== CHARTE) {
      for (const m of s.matchAll(/var\(\s*--font-(?:ui|titre|code)\s*\)/g))
        if (!dans(z, m.index)) fautes.C.push(f + ':' + ligneDe(s, m.index) + ' ' + m[0]);
      for (const m of s.matchAll(/--font-(?:ui|titre)\s*:/g))
        if (!dans(z, m.index)) fautes.D.push(f + ':' + ligneDe(s, m.index) + ' réglage redéclaré hors de la feuille');
    }
    /* F. --sans */
    for (const m of s.matchAll(/var\(\s*--sans\b/g))
      if (!dans(z, m.index)) fautes.F.push(f + ':' + ligneDe(s, m.index));
  }
  /* G. les exemptions servent toutes, au compte exact */
  EXEMPTIONS.forEach((e, k) => { if (exemptCompte[k] !== e.n) fautes.G.push(e.fichier + ' « ' + e.extrait + ' » : ' + exemptCompte[k] + ' nom(s) pour ' + e.n + ' attendu(s)'); });

  /* D. le réglage, une fois chacun, dans la feuille */
  const NU = sansCom(SRC[CHARTE] || '');
  for (const m of sansCom(SRC[FEUILLE] || '').matchAll(/--font-(?:ui|titre)\s*:/g)) fautes.D.push(FEUILLE + ' : ' + m[0] + ' redéclaré hors de la charte');
  const valeurs = {};
  for (const j of ['--font-ui', '--font-titre']) {
    const decl = [...NU.matchAll(new RegExp(j.replace(/-/g, '\\-') + '\\s*:\\s*([^;}]+)', 'g'))];
    if (decl.length !== 1) fautes.D.push(CHARTE + ' : ' + j + ' déclaré ' + decl.length + ' fois (attendu : 1)');
    else valeurs[j] = decl[0][1].trim();
  }
  /* E. la première police de chaque réglage a ses fichiers */
  const FF = SRC[POLICES] || '';
  const servies = new Set([...FF.matchAll(/@font-face\s*\{[^}]*?font-family\s*:\s*(['"]?)([^;'"}]+)\1/g)].map(m => m[2].trim().toLowerCase()));
  for (const [j, v] of Object.entries(valeurs)) {
    const premiere = v.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
    if (GENERIQUES.includes(premiere.toLowerCase())) continue;
    if (!servies.has(premiere.toLowerCase()))
      fautes.E.push(j + ' commence par « ' + premiere + ' », absente de ' + POLICES
        + ' — ajouter ses fichiers dans public/fonts/ et ses @font-face, sinon chaque téléphone prendra une police de secours');
  }
  return { fautes, vus, valeurs };
}

/* ══ Verdict ═══════════════════════════════════════════════════════════════ */
const SRC0 = Object.fromEntries([...FICHIERS, POLICES].map(f => [f, lire(f)]));
let ok = 0, ko = 0;
const t = (nom, cond, detail) => {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail ? '\n      → ' + detail : '')); }
};
const liste = a => a.slice(0, 6).join('\n        ') + (a.length > 6 ? '\n        … (+' + (a.length - 6) + ')' : '');

if (!CONTRE) {
  console.log('\n── LA POLICE PASSE PAR LA CHARTE — lot CHARTE-1 (§367)\n');
  const { fautes, vus, valeurs } = verifier(SRC0);
  /* Garde de lecture (§25) : un balayage qui ne lit rien passerait au vert. */
  t('la lecture voit les deux réglages et leurs replis (' + vus.definitions + ' noms en définition, '
    + vus.replis + ' en repli, ' + vus.exemptes + ' exemptés)', vus.definitions >= 2 && vus.replis > 0);
  t('aucune police écrite en toutes lettres hors réglage, repli ou exemption (' + fautes.A.length + ')', fautes.A.length === 0, liste(fautes.A));
  t('aucun repli ne ment sur son rôle (' + fautes.B.length + ')', fautes.B.length === 0, liste(fautes.B));
  t('hors de styles.css, chaque var(--font-*) porte son repli (' + fautes.C.length + ' nu(s))', fautes.C.length === 0,
    liste(fautes.C) + '\n        impressions, écran de démarrage, boot.js : la feuille n’y est pas, le réglage n’existe pas');
  t('--font-ui et --font-titre déclarés une fois chacun, dans la charte (src/charte.css)', fautes.D.length === 0, liste(fautes.D));
  t('la police de chaque réglage a ses fichiers (' + Object.values(valeurs).map(v => v.split(',')[0]).join(' · ') + ')',
    fautes.E.length === 0, liste(fautes.E));
  t('--sans ne revient pas (' + fautes.F.length + ')', fautes.F.length === 0, liste(fautes.F));
  t('chaque exemption sert, au compte exact', fautes.G.length === 0, liste(fautes.G));
} else {
  /* ══ CONTRE-ÉPREUVES — le défaut posé EN MÉMOIRE, la règle visée doit rougir ═══ */
  console.log('\n── CONTRE-ÉPREUVES — la police passe par la charte (CHARTE-1)\n');
  const muter = (f, fn) => { const S = { ...SRC0 }; const avant = S[f]; S[f] = fn(avant); if (S[f] === avant) throw new Error('défaut non posé : ' + f); return S; };
  const remplacer1 = (s, a, b) => { const i = s.indexOf(a); if (i < 0) throw new Error('ancre absente : ' + a); return s.slice(0, i) + b + s.slice(i + a.length); };
  const CAS = [
    ['une police revient en toutes lettres dans un module', 'A',
      () => muter('src/cave.js', s => s + "\nwindow._zz = '<b style=\"font-family:Outfit,sans-serif\">x</b>';\n")],
    ['une police revient en toutes lettres dans la feuille', 'A',
      () => muter(FEUILLE, s => s + "\n.zz-a{font-family:'Cormorant Garamond',serif}\n")],
    ['un raccourci font: revient en toutes lettres', 'A',
      () => muter(FEUILLE, s => s + "\n.zz-b{font:600 13px 'Outfit',sans-serif}\n")],
    ['un attribut SVG revient en toutes lettres', 'A',
      () => muter('src/pilotage.js', s => remplacer1(s, 'font-family="var(--font-ui,Outfit)"', 'font-family="Outfit"'))],
    ['une page GT reprend la police en dur', 'A',
      () => muter('src/gt/console.html', s => s + '\n<div style="font-family:Outfit,sans-serif">x</div>\n')],
    ['un repli ment sur son rôle', 'B',
      () => muter('src/cave.js', s => s + "\nwindow._zz = 'font-family:var(--font-ui,\\'Cormorant Garamond\\',serif)';\n")],
    ['un var(--font-ui) part sans repli dans un module', 'C',
      () => muter('src/reserve.js', s => s + "\nwindow._zz = 'font-family:var(--font-ui)';\n")],
    ['le réglage est déclaré deux fois', 'D',
      () => muter(FEUILLE, s => s + '\n:root{--font-ui:Outfit,sans-serif}\n')],
    ['le réglage des titres disparaît', 'D',
      () => muter(CHARTE, s => s.replace(/--font-titre\s*:/, '--font-titre-x:'))],
    ['un module redéclare le réglage', 'D',
      () => muter('src/utils.js', s => s + "\nwindow._zz = ':root{--font-ui:Inter}';\n")],
    ['la police change sans ses fichiers', 'E',
      () => muter(CHARTE, s => s.replace(/--font-ui\s*:\s*Outfit/, '--font-ui:Inter'))],
    ['--sans revient', 'F',
      () => muter(FEUILLE, s => s + '\n.zz-c{font:600 13px var(--sans)}\n')],
    ['une exemption ne sert plus', 'G',
      () => muter('src/whats-new.js', s => s.replace('passent en Cormorant', 'passent en serif'))]
  ];
  for (const [nom, regle, fab] of CAS) {
    let S; try { S = fab(); } catch (e) { t(nom + ' — ' + e.message, false); continue; }
    const { fautes } = verifier(S);
    t(nom + ' → la règle ' + regle + ' rougit', fautes[regle].length > 0);
  }
  /* Témoins : ce qui ne doit PAS rougir. */
  const temoins = [
    ['une police nommée dans un commentaire ne compte pas', () => muter('src/cave.js', s => s + "\n// la police Outfit, pour mémoire\n")],
    ['un repli à son bon rôle ne compte pas', () => muter('src/cave.js', s => s + "\nwindow._zz = 'font-family:var(--font-titre,\\'Cormorant Garamond\\',serif)';\n")],
    ['une famille générique en tête du réglage ne demande pas de fichier', () => muter(CHARTE, s => s.replace(/--font-ui\s*:\s*Outfit,/, '--font-ui:system-ui,'))]
  ];
  for (const [nom, fab] of temoins) {
    const { fautes } = verifier(fab());
    const total = Object.values(fautes).reduce((n, a) => n + a.length, 0);
    t('témoin — ' + nom, total === 0, Object.entries(fautes).filter(([, a]) => a.length).map(([k, a]) => k + ' : ' + a[0]).join(' · '));
  }
}

console.log('\n  ' + ok + ' vertes, ' + ko + ' rouges\n');
process.exit(ko ? 1 : 0);
