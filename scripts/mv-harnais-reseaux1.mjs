#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — RESEAUX-1 (§623) : LES PAGES DU SITE MÈNENT À LINKEDIN, FACEBOOK ET INSTAGRAM
   Lancer :          node scripts/mv-harnais-reseaux1.mjs
   Contre-épreuves : node scripts/mv-harnais-reseaux1.mjs --contre

   CE QU’IL GARDE (lu dans les quatre pages du site au pied « pied » et dans public/llms.txt)
   ① chaque page (logiciel-vigne et les trois pages « cas d’usage ») porte, dans son pied de page, les trois liens :
      la page entreprise LinkedIn, la page Facebook, le compte Instagram — dans cet ordre, une seule fois chacun ;
   ② les adresses sont les adresses PUBLIQUES : la page LinkedIn sans la vue d’administration (`/admin/…`, ce que
      Nico copie depuis sa barre d’adresse), Facebook sans le paramètre de langue (`&locale=`) ;
   ③ chaque lien ouvre un nouvel onglet avec `noopener` (la page ouverte ne peut pas piloter la nôtre) ;
   ④ le JSON-LD de logiciel-vigne déclare les trois mêmes adresses en `sameAs` sur « Ma Vigne » (ce qui relie, pour
      Google et les IA, le logiciel à ses pages) — et rien d’autre ;
   ⑤ llms.txt donne les trois mêmes adresses.
   ⚠️ Il ne vérifie pas que les pages existent sur LinkedIn, Facebook et Instagram : elles sont hors du dépôt.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');

const LI = 'https://www.linkedin.com/company/147018340/';
const FB = 'https://www.facebook.com/profile.php?id=61596214465759';
const IG = 'https://www.instagram.com/mavigneapp/';
const PAGES = ['logiciel-vigne', 'registre-phytosanitaire-2027', 'suivi-temps-travail-vigne', 'gestion-equipe-viticole'];
const S0 = { llms: lire('public/llms.txt') };
for (const p of PAGES) S0[p] = lire('public/' + p + '.html');

const sansCommentaires = (h) => h.replace(/<!--[\s\S]*?-->/g, '');
const pied = (h) => { const i = h.indexOf('<footer class="pied">'); return i < 0 ? '' : h.slice(i, h.indexOf('</footer>', i)); };
const liens = (h) => [...h.matchAll(/<a\b([^>]*)>([^<]*)<\/a>/g)].map((m) => ({
  href: (m[1].match(/href="([^"]*)"/) || [])[1] || '', rel: (m[1].match(/rel="([^"]*)"/) || [])[1] || '',
  cible: (m[1].match(/target="([^"]*)"/) || [])[1] || '', texte: m[2].trim() }));
const reseau = (l) => /linkedin\.com|facebook\.com|instagram\.com/.test(l.href);

function suite(S) {
  const out = []; const T = (n, c, d = '') => out.push([n, !!c, d]);

  for (const p of PAGES) {
    const L = liens(pied(sansCommentaires(S[p]))).filter(reseau);
    T(`① ${p} : LinkedIn, Facebook, Instagram dans le pied de page, dans cet ordre, une fois chacun`,
      L.map((l) => l.href).join(' ') === [LI, FB, IG].join(' ') && L.map((l) => l.texte).join() === 'LinkedIn,Facebook,Instagram',
      L.map((l) => l.texte + '=' + l.href).join(' | '));
    T(`③ ${p} : chaque lien ouvre un nouvel onglet avec noopener`,
      L.length === 3 && L.every((l) => l.cible === '_blank' && /\bnoopener\b/.test(l.rel)));
  }

  const tout = PAGES.map((p) => S[p]).join('\n') + '\n' + S.llms;
  T('② LinkedIn : la page publique, jamais la vue d’administration', !/linkedin\.com\/company\/[^"\s)]*\/admin/.test(tout) && tout.includes(LI));
  T('② Facebook : sans le paramètre de langue de la barre d’adresse', !/facebook\.com\/[^"\s)]*locale=/.test(tout));

  const ld = (S['logiciel-vigne'].match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1] || '';
  let app = null, lisible = true;
  try { app = (JSON.parse(ld)['@graph'] || []).find((n) => n['@type'] === 'SoftwareApplication' && n.name === 'Ma Vigne'); } catch { lisible = false; }
  T('④ le JSON-LD de logiciel-vigne se lit, et « Ma Vigne » y est', lisible && !!app);
  T('④ sameAs de « Ma Vigne » = les trois adresses du pied de page, et rien d’autre',
    !!app && Array.isArray(app.sameAs) && app.sameAs.join(' ') === [LI, FB, IG].join(' '), app ? JSON.stringify(app.sameAs) : '');

  const sec = (S.llms.split('## Suivre Ma Vigne')[1] || '').split('\n## ')[0];
  T('⑤ llms.txt : une section « Suivre Ma Vigne » avec les trois adresses',
    sec.includes('(' + LI + ')') && sec.includes('(' + FB + ')') && sec.includes('(' + IG + ')'));
  return out;
}

const sur = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('mutant sans prise : ' + a.slice(0, 70)); return { ...S, [cle]: S[cle].replace(a, b) }; };
const MUTANTS = [
  ['l’adresse copiée depuis la vue d’administration', sur('registre-phytosanitaire-2027', 'href="' + LI + '"', 'href="' + LI + 'admin/dashboard/"')],
  ['Facebook avec le paramètre de langue', sur('logiciel-vigne', 'href="' + FB + '"', 'href="' + FB + '&locale=fr_FR"')],
  ['Instagram oublié sur une page cas d’usage', sur('gestion-equipe-viticole', ' · <a href="' + IG + '" rel="me noopener" target="_blank">Instagram</a>', '')],
  ['un lien sans noopener', sur('suivi-temps-travail-vigne', 'href="' + FB + '" rel="me noopener"', 'href="' + FB + '" rel="me"')],
  ['un lien qui reste dans l’onglet', sur('logiciel-vigne', 'href="' + IG + '" rel="me noopener" target="_blank"', 'href="' + IG + '" rel="me noopener"')],
  ['l’ordre des réseaux inversé', sur('registre-phytosanitaire-2027', '>LinkedIn</a>', '>Facebook</a>')],
  ['sameAs perd Instagram', sur('logiciel-vigne', ',\n        "' + IG + '"\n      ]', '\n      ]')],
  ['sameAs garde la vue d’administration', sur('logiciel-vigne', '"sameAs": [\n        "' + LI + '"', '"sameAs": [\n        "' + LI + 'admin/"')],
  ['le JSON-LD cassé par une virgule', sur('logiciel-vigne', '"sameAs": [', '"sameAs": [,')],
  ['llms.txt oublie LinkedIn', sur('llms', '- [LinkedIn](' + LI + ')', '- LinkedIn')],
];

const vert = (S) => suite(S).every(([, ok]) => ok);
if (!CONTRE) {
  const r = suite(S0); let ko = 0;
  for (const [n, ok, d] of r) { console.log(`  ${ok ? '✓' : '✗'} ${n}${!ok && d ? '  [' + d + ']' : ''}`); if (!ok) ko++; }
  console.log(ko ? `✗ réseaux : ${ko} rouge(s) sur ${r.length}` : `✓ réseaux : ${r.length} vertes`);
  process.exit(ko ? 1 : 0);
} else {
  if (!vert(S0)) { console.log('✗ la suite doit être verte avant les contre-épreuves'); process.exit(1); }
  let ko = 0;
  for (const [nom, m] of MUTANTS) {
    let S; try { S = m(S0); } catch (e) { console.log(`  ✗ ${nom} : ${e.message}`); ko++; continue; }
    const rouge = suite(S).find(([, ok]) => !ok);
    console.log(rouge ? `  ✓ ${nom} → rougit (${rouge[0]})` : `  ✗ ${nom} → reste vert`); if (!rouge) ko++;
  }
  console.log(ko ? `✗ contre-épreuve réseaux : ${ko} mutant(s) non vus` : `✓ contre-épreuve réseaux : ${MUTANTS.length}/${MUTANTS.length}`);
  process.exit(ko ? 1 : 0);
}
