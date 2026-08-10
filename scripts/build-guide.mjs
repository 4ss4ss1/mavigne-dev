#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Generateur du guide public
// ═══════════════════════════════════════════════════════════════════════════
//  public/guide.html faisait 104 ko dans un seul fichier. Consequence : on ne
//  le relisait plus, et il a fini par decrire des ecrans d'il y a plusieurs
//  mois — un Pilotage a six onglets, une Cave a deux sections, une Reserve
//  sans parc a futs. Une modification de module touchait 104 ko ; elle touche
//  maintenant UN fichier de quelques ko.
//
//  ⚠ CE SCRIPT N'EST PAS DANS LE BUILD, ET C'EST VOULU.
//    `npm run build` ne doit dependre de rien de plus (regle : jamais un second
//    `&& node scripts/...`). On regenere a la main quand une source bouge :
//        node scripts/build-guide.mjs
//    puis `firebase deploy --only hosting`. Aucun bump : guide.html est une
//    page de public/, hors SHELL_STATIC.
//
//  ⚠ LE GUIDE N'EST PAS ECRIT PAR UNE MACHINE. Ce script ASSEMBLE des sources
//    ecrites a la main ; il n'en genere aucune phrase. Seule la barre de
//    sommaire est construite, a partir de l'en-tete @nav de chaque section —
//    c'etait la seule chose reellement dupliquee : un titre changeait dans la
//    section et restait faux dans le sommaire.
//
//  --check : ne rien ecrire, et sortir en erreur si le guide deploye differe
//            de ce que les sources produisent. Sert de garde-fou avant deploy.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import path from 'node:path';

const RACINE = process.argv.find(a => !a.startsWith('-') && a !== process.argv[0] && a !== process.argv[1]) || '.';
const SRC = path.join(RACINE, 'guide');
const OUT = path.join(RACINE, 'public', 'guide.html');
const CHECK = process.argv.includes('--check');

function lire(p) { return fs.readFileSync(p, 'utf8'); }

const layout = lire(path.join(SRC, '_layout.html'));
const inter = lire(path.join(SRC, '_inter.txt'));

// Ordre = ordre des fichiers, donne par leur numero. Deplacer une section dans
// le guide = renommer un fichier, rien d'autre.
const fichiers = fs.readdirSync(SRC)
  .filter(f => /^\d{2}-[a-z]+\.html$/.test(f))
  .sort();
if (!fichiers.length) { console.error('Aucune section dans ' + SRC); process.exit(1); }

const RE_NAV = /^<!-- @nav emoji="([^"]*)" titre="([^"]*)" sous="([^"]*)" -->\n/;
const sections = [];
const nav = [];
const vus = new Set();

for (const f of fichiers) {
  const brut = lire(path.join(SRC, f));
  const m = brut.match(RE_NAV);
  if (!m) { console.error(f + ' : en-tete @nav manquant.'); process.exit(1); }
  const corps = brut.slice(m[0].length).replace(/\n+$/, '');
  const id = (corps.match(/^<section id="([a-z0-9-]+)">/) || [])[1];
  if (!id) { console.error(f + ' : la section doit commencer par <section id="...">.'); process.exit(1); }
  if (vus.has(id)) { console.error(f + ' : id « ' + id + ' » deja utilise.'); process.exit(1); }
  vus.add(id);
  sections.push(corps);
  nav.push('<a href="#' + id + '"><em aria-hidden="true">' + m[1] + '</em><span>' + m[2]
    + '<br><span style="font-size:11.5px;color:var(--muted)">' + m[3] + '</span></span></a>');
}

const html = layout
  .replace('<!--@nav-->\n', nav.join('\n') + '\n')
  .replace('<!--@sections-->', sections.join(inter));

if (CHECK) {
  const actuel = fs.existsSync(OUT) ? lire(OUT) : '';
  if (actuel === html) { console.log('guide.html est a jour (' + fichiers.length + ' sections).'); process.exit(0); }
  console.error('guide.html DIFFERE de ses sources — relancer : node scripts/build-guide.mjs');
  process.exit(1);
}

fs.writeFileSync(OUT, html, 'utf8');
console.log('guide.html ecrit : ' + fichiers.length + ' sections, ' + html.length + ' caracteres.');
