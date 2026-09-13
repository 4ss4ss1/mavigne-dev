#!/usr/bin/env node
// ============================================================================
//  MA VIGNE — Le sitemap ne derive plus (SEO-1)
//  --------------------------------------------------------------------------
//  ★★★ POURQUOI CE SCRIPT EXISTE (13/09/2026).
//  Les six `<lastmod>` du sitemap etaient TOUS perimes : logiciel-vigne annonce
//  au 15 aout une page commitee le 6 septembre, essai au 1er juillet pour une
//  page du 6 septembre. Personne ne s'en apercoit — un sitemap ne casse rien,
//  il ment juste a Google, et les pages fraiches passent pour des vieilleries.
//  C22 dit la meme chose de l'accompagnement : ce qui DECRIT le produit doit
//  etre tenu par un filet, pas par la memoire de celui qui livre.
//
//  DEUX REGLES TENUES ICI :
//    ★ un `<lastmod>` ne peut pas etre ANTERIEUR au dernier commit de sa page ;
//    ★ toute page publique INDEXABLE est soit dans le sitemap, soit dans la
//      liste d'exclusions ci-dessous — jamais nulle part. Une page qui invite
//      l'indexation (`index,follow`) et qu'aucun sitemap ne cite est un choix,
//      pas un oubli : alors il s'ecrit.
//
//  Usage :
//    node scripts/mv-sitemap.mjs --check   # controle (CI) — exit 1 si derive
//    node scripts/mv-sitemap.mjs           # reecrit les lastmod depuis git
//  LECTURE SEULE en --check. Vit dans scripts/ -> jamais deploye, aucun bump.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const PUBLIC = path.join(RACINE, 'public');
const SITEMAP = path.join(PUBLIC, 'sitemap.xml');
const CHECK  = process.argv.includes('--check');

// ── Les pages publiques indexables volontairement HORS sitemap ──────────────
// ⚠️ Ce n'est pas une liste de commodite : chaque entree porte sa raison, et
//    c'est elle qu'on relit quand on se demande « pourquoi cette page n'y est
//    pas ». Ajouter une page ici est une DECISION, pas un contournement.
const HORS_SITEMAP = {
  'cgu.html':           'juridique — cite depuis le pied de page, pas une porte d\u2019entree',
  'dpa.html':           'juridique — annexe des CGU, pas une porte d\u2019entree',
  'mise-en-route.html': 'noindex,nofollow — formulaire client, jamais public',
};

const rouge = [], vert = [];
const dit = (ok, msg) => { (ok ? vert : rouge).push(msg); console.log((ok ? '   \u001b[32mvert \u001b[0m  ' : '   \u001b[31mROUGE\u001b[0m  ') + msg); };

// ── Date du dernier commit d'un fichier (AAAA-MM-JJ) ────────────────────────
function dateGit(rel) {
  try {
    const d = execFileSync('git', ['log', '-1', '--format=%ad', '--date=short', '--', rel],
      { cwd: RACINE, encoding: 'utf8' }).trim();
    return d || null;
  } catch { return null; }
}

// ── Inventaire des pages publiques ──────────────────────────────────────────
const pages = fs.readdirSync(PUBLIC).filter(f => f.endsWith('.html')).sort();
const indexable = pages.filter(f => {
  const html = fs.readFileSync(path.join(PUBLIC, f), 'utf8');
  const m = /<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i.exec(html);
  return !(m && /noindex/i.test(m[1]));   // pas de balise = indexable par defaut
});

// ── Lecture du sitemap ──────────────────────────────────────────────────────
let xml = fs.readFileSync(SITEMAP, 'utf8');
const entrees = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m => {
  const bloc = m[1];
  const loc = (/<loc>([^<]+)<\/loc>/.exec(bloc) || [])[1] || '';
  const lm  = (/<lastmod>([^<]+)<\/lastmod>/.exec(bloc) || [])[1] || '';
  return { bloc: m[0], loc, lastmod: lm, fichier: loc.split('/').pop() };
});

console.log('\n\u001b[1m\u2500\u2500 SITEMAP \u2014 les lastmod suivent-ils les pages ? \u2500\u2500\u001b[0m');
console.log('\u001b[2m  ' + pages.length + ' page(s) publique(s) \u00b7 ' + indexable.length
  + ' indexable(s) \u00b7 ' + entrees.length + ' dans le sitemap\u001b[0m');

// ── R1 : chaque lastmod est au moins aussi recent que son dernier commit ────
for (const e of entrees) {
  const rel = 'public/' + e.fichier;
  if (!fs.existsSync(path.join(RACINE, rel))) { dit(false, e.fichier + ' \u2014 cite au sitemap mais ABSENT de public/'); continue; }
  const g = dateGit(rel);
  if (!g) { dit(true, e.fichier + ' \u2014 pas d\u2019historique git (fichier neuf), ignore'); continue; }
  if (e.lastmod < g) { dit(false, e.fichier + ' \u2014 lastmod ' + e.lastmod + ' < dernier commit ' + g); e.attendu = g; }
  else dit(true, e.fichier + ' \u2014 lastmod ' + e.lastmod + ' \u2265 commit ' + g);
}

// ── R2 : aucune page indexable orpheline ────────────────────────────────────
const cites = new Set(entrees.map(e => e.fichier));
for (const f of indexable) {
  if (cites.has(f)) continue;
  if (HORS_SITEMAP[f]) { dit(true, f + ' \u2014 hors sitemap, assume : ' + HORS_SITEMAP[f]); continue; }
  dit(false, f + ' \u2014 indexable, ni dans le sitemap ni dans HORS_SITEMAP (choisir, puis l\u2019ecrire)');
}

// ── R3 : rien dans HORS_SITEMAP ne doit se retrouver dans le sitemap ────────
for (const f of Object.keys(HORS_SITEMAP)) {
  if (cites.has(f)) dit(false, f + ' \u2014 declare hors sitemap ET cite dedans : les deux ne peuvent pas etre vrais');
}

// ── R4 : un <loc> doit correspondre au canonical de la page ─────────────────
for (const e of entrees) {
  const p = path.join(PUBLIC, e.fichier);
  if (!fs.existsSync(p)) continue;
  const c = (/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i.exec(fs.readFileSync(p, 'utf8')) || [])[1];
  if (!c) { dit(false, e.fichier + ' \u2014 aucune balise canonical'); continue; }
  if (c !== e.loc) dit(false, e.fichier + ' \u2014 canonical ' + c + ' \u2260 loc ' + e.loc);
  else dit(true, e.fichier + ' \u2014 canonical align\u00e9');
}

// ── Reecriture (hors --check) ───────────────────────────────────────────────
if (!CHECK) {
  let n = 0;
  for (const e of entrees) {
    if (!e.attendu) continue;
    xml = xml.replace(e.bloc, e.bloc.replace('<lastmod>' + e.lastmod + '</lastmod>',
                                             '<lastmod>' + e.attendu + '</lastmod>'));
    n++;
  }
  if (n) { fs.writeFileSync(SITEMAP, xml); console.log('\n  \u2192 ' + n + ' lastmod remis \u00e0 jour dans public/sitemap.xml'); }
  else console.log('\n  \u2192 rien \u00e0 r\u00e9\u00e9crire');
  process.exit(0);
}

if (rouge.length) console.log('\n\u001b[2m  \u2192 la remise \u00e0 jour est une commande : node scripts/mv-sitemap.mjs (sans --check),\n     A LANCER APRES le commit des pages \u2014 c\'est git qui date, pas le disque.\u001b[0m');
console.log('\n\u001b[1m  ' + vert.length + ' vert \u00b7 ' + rouge.length + ' rouge\u001b[0m\n');
process.exit(rouge.length ? 1 : 0);
