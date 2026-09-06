#!/usr/bin/env node
// ── HARNAIS : AUCUNE DONNEE PERSONNELLE DANS CE QUI EST PUBLIE ──────────────
//
//  ★★★ CE QU'IL A FALLU DECOUVRIR POUR L'ECRIRE (05/09/2026).
//  `src/app.js` portait, depuis le tout premier commit :
//    · un roster en dur de SEPT personnes nommees, avec leur adresse e-mail
//      PERSONNELLE REELLE ;
//    · le parcellaire complet du domaine de reference — 46 parcelles, nom,
//      surface, latitude, longitude.
//  Les deux partaient dans le bundle minifie servi a CHAQUE domaine client, et
//  vivaient dans un depot GitHub public. Ce n'etaient pas les donnees de
//  l'editeur : celles de ses collegues et de son employeur.
//
//  ★★ POURQUOI PERSONNE NE L'A VU. Aucun controle ne regardait le CONTENU des
//  donnees, seulement leur forme. Le preflight compte des selecteurs, ESLint lit
//  de la syntaxe, les harnais rejouent des moteurs. Une adresse e-mail est du
//  texte parfaitement valide : elle traverse tout, jusqu'au CDN.
//
//  CE QUE FAIT CE HARNAIS. Il lit les fichiers REELLEMENT PUBLIES — les sources
//  qui entrent dans le bundle, plus `public/sw.js` qui est servi tel quel — et
//  refuse toute adresse e-mail litterale. Deux seules exceptions, nommees et
//  justifiees une par une ci-dessous : ce sont des ADRESSES DE L'EDITEUR, dont
//  l'une est une mention legale obligatoire. Une exception se decide, elle ne
//  se glisse pas.
//
//  ⚠️ CE QU'IL NE PROUVE PAS, ET C'EST LE PLUS IMPORTANT :
//  ① L'HISTORIQUE GIT GARDE TOUT. Retirer une adresse d'un fichier ne la retire
//     pas d'un depot : `git log -p` la rend. Ce harnais protege les prochains
//     commits, pas les precedents. Le passe se traite hors code (depot prive,
//     reecriture d'historique, purge demandee au support GitHub).
//  ② Il ne voit que les adresses e-mail. Les noms de domaines clients dans les
//     commentaires, les cas de facturation nominatifs, un parcellaire recolle en
//     dur : rien de tout cela n'a de forme reconnaissable. Le controle mecanique
//     s'arrete la ou commence la relecture.
//
//  Contre-epreuve : `node scripts/mv-harnais-confidentialite.mjs --contre`
//  reinjecte en memoire une adresse de tiers dans chaque fichier surveille et
//  exige que le harnais rougisse a chaque fois. Un filet qu'on n'a pas vu
//  attraper quelque chose n'est pas un filet.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/* ⚠️ chemin portable : jamais new URL().pathname (§53) */
const ICI = dirname(fileURLToPath(import.meta.url));
const RACINE = join(ICI, '..');

const c = {
  g: (s) => `\x1b[32m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m`,
  d: (s) => `\x1b[2m${s}\x1b[0m`,  b: (s) => `\x1b[1m${s}\x1b[0m`,
};

// ═══════════════════════════════════════════════════════════════════════════
// 1. Ce qui est publie
// ═══════════════════════════════════════════════════════════════════════════

/* `src/**` entre dans le bundle. `public/sw.js` est servi tel quel a la racine
   du domaine : n'importe qui peut l'ouvrir dans un onglet. */
const SURVEILLES = [
  ...readdirSync(join(RACINE, 'src')).filter((f) => f.endsWith('.js')).sort().map((f) => 'src/' + f),
  'public/sw.js',
];

// ═══════════════════════════════════════════════════════════════════════════
// 2. Les deux seules adresses tolerees, et pourquoi
// ═══════════════════════════════════════════════════════════════════════════

/* ⚠️ CETTE LISTE NE S'ALLONGE PAS PAR COMMODITE. Chaque entree est une adresse
   de l'EDITEUR, jamais d'un tiers, et porte sa raison. Une adresse de salarie,
   de client ou de prospect n'a aucune raison d'y figurer un jour. */
const TOLEREES = new Map([
  ['ngdevpro@gmail.com',
   'compte GT admin (GT_ADMIN_EMAIL) — et mention legale obligatoire de l\u2019editeur dans index.html'],
  ['gueret.nicolas@gmail.com',
   'compte admin du domaine de reference, present dans DEV_EMAILS (acces etendu de test)'],
]);

/* Domaines de courriel fictifs employes par l'application elle-meme pour les
   comptes sans adresse reelle. Ce ne sont les adresses de personne. */
const FICTIFS = /@(mavigne\.app|mavigneapp\.fr|example\.(com|org)|domaine\.fr|adresse\.fr)$/i;

const RE_MAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// ═══════════════════════════════════════════════════════════════════════════
// 3. Le controle
// ═══════════════════════════════════════════════════════════════════════════

function scanner(sources) {
  const trouvailles = [];
  for (const [fichier, txt] of sources) {
    const lignes = txt.split('\n');
    for (let i = 0; i < lignes.length; i++) {
      for (const m of lignes[i].match(RE_MAIL) || []) {
        const adr = m.toLowerCase();
        if (FICTIFS.test(adr) || TOLEREES.has(adr)) continue;
        trouvailles.push({ fichier, ligne: i + 1, adr });
      }
    }
  }
  return trouvailles;
}

const SOURCES = new Map(SURVEILLES.map((f) => [f, readFileSync(join(RACINE, f), 'utf8')]));
const CONTRE = process.argv.includes('--contre');

// ═══════════════════════════════════════════════════════════════════════════
// 4. Passe normale
// ═══════════════════════════════════════════════════════════════════════════

if (!CONTRE) {
  console.log(c.b('\n── HARNAIS CONFIDENTIALITE — aucune adresse de tiers dans le publie ──\n'));
  console.log(c.d(`  ${SURVEILLES.length} fichier(s) surveille(s) · ${TOLEREES.size} adresse(s) toleree(s) :`));
  for (const [adr, pourquoi] of TOLEREES) console.log(c.d(`    · ${adr} — ${pourquoi}`));

  const t = scanner(SOURCES);
  if (!t.length) {
    console.log(c.g('\n  ✓ aucune adresse de tiers dans ce qui part chez le client\n'));
    console.log(c.d('    ⚠ ne dit RIEN de l\'historique git, ni des noms de clients en commentaire.\n'));
    process.exit(0);
  }

  console.log(c.r(`\n  ✗ ${t.length} adresse(s) de tiers dans du code publie\n`));
  for (const x of t) console.log(c.r(`    · ${x.adr}`) + c.d(`  — ${x.fichier}:${x.ligne}`));
  console.log(c.d('\n    Une adresse ne vit pas dans le code : elle vit dans Firestore, sur la fiche'));
  console.log(c.d('    du membre. Si elle est indispensable au fonctionnement et appartient a'));
  console.log(c.d('    l\'editeur, l\'ajouter a TOLEREES avec sa raison — jamais sans.\n'));
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. Contre-epreuves
// ═══════════════════════════════════════════════════════════════════════════

console.log(c.b('\n── CONTRE-EPREUVES — le filet attrape-t-il vraiment ? ──\n'));
let ok = 0, ko = 0;
const T = (n, vrai, det) => {
  if (vrai) { ok++; console.log('  ' + c.g('✓') + ' ' + n); }
  else { ko++; console.log('  ' + c.r('✗ ' + n) + (det ? c.d('  ' + det) : '')); }
};

T('depart vert : aucune adresse de tiers dans les sources livrees', scanner(SOURCES).length === 0,
  scanner(SOURCES).map((x) => x.adr).join(' · '));

/* Une adresse de tiers reinjectee dans CHAQUE fichier surveille doit rougir.
   Un harnais qui ne regarde qu'app.js laisserait passer la meme faute ailleurs. */
for (const f of SURVEILLES) {
  const s = new Map(SOURCES);
  s.set(f, '// prenom.nom-de-tiers@exemple-reel.fr\n' + s.get(f));
  T(`une adresse de tiers dans ${f} → rouge`,
    scanner(s).some((x) => x.fichier === f), 'passee inapercue');
}

/* Contre-epreuve INVERSE : les adresses fictives de l'application et les deux
   adresses de l'editeur ne doivent PAS rougir, sinon le harnais crie a chaque
   build et finit desactive — ce qui revient a ne pas l'avoir ecrit. */
{
  const s = new Map(SOURCES);
  s.set('src/utils.js', "// alexandre@mavigneapp.fr, simon@mavigne.app, ngdevpro@gmail.com\n" + s.get('src/utils.js'));
  T('adresses fictives et adresses de l\'editeur → restent vertes', scanner(s).length === 0,
    scanner(s).map((x) => x.adr).join(' · '));
}

/* Et la faute historique elle-meme, telle qu'elle etait ecrite. */
{
  const s = new Map(SOURCES);
  s.set('src/app.js', "let MEMBRES = [{nom:'X', email:'prenom.nom1234@yahoo.com'}];\n" + s.get('src/app.js'));
  T('le roster en dur du 05/09, rejoue tel quel → rouge',
    scanner(s).some((x) => x.adr === 'prenom.nom1234@yahoo.com'), 'reste vert');
}

console.log(`\n  ${ok} vert(s) · ${ko} rouge(s)\n`);
process.exit(ko ? 1 : 0);
