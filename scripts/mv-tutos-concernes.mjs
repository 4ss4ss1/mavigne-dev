#!/usr/bin/env node
// ★★ TUTO-10 (§425) — L'AIGUILLAGE : QUELS TUTOS UN CHANGEMENT CONCERNE.
//   node scripts/mv-tutos-concernes.mjs                → la liste et ses raisons (ce qui a changé depuis le dernier commit)
//   node scripts/mv-tutos-concernes.mjs --base HEAD~1  → depuis un autre commit (ici : ce qu'a changé le dernier envoi)
//   node scripts/mv-tutos-concernes.mjs --json
// Nico (22/10) : « que les tutos suivent les modifications de l'application […] sans rallonger le temps de vérification ».
// Rejouer TOUS les tutos à chaque lot coûte ~1 min 30 par tuto (7 min pour quatre ; une heure à quarante). Or chaque tuto a
// déjà sa fiche : son entrée de TU_TUTOS, les fonctions qu'il enseigne (`couvre`), les boutons qu'il vise (`data-tuto`).
// L'aiguillage compare ce que le changement touche à ces fiches, et dit quoi rejouer :
//   · TOUS — le moteur ou le domaine d'entraînement (tutos.js hors de la liste des tutos), le bac à sable (boot.js, la porte
//     de firebase.js), le chemin vers un module (le dock, la barre latérale : les étapes « aller » se calculent dessus) ;
//   · UN TUTO — sa fiche, une fonction qu'il enseigne, ou l'endroit du code qui dessine un bouton qu'il vise (la fonction
//     qui porte l'étiquette, ou sa ligne d'index.html) ;
//   · LE CÔTE À CÔTE — la mise en page du panneau : la barre latérale, une feuille de styles.
// On compare le CODE : un commentaire changé ne fait rien rejouer, ni un espace, ni une fin de ligne Windows.
// Ce que l'aiguillage ne voit pas — une feuille de styles qui cacherait un bouton visé, un écran qui change sans toucher ni
// les fonctions enseignées ni les boutons visés — la CI le rattrape : elle rejoue TOUT après chaque envoi. Une prise de la
// CI = un lien qui manquait à une fiche : on l'ajoute (à `couvre`, ou ici), et elle ne se reproduit plus.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const TOUS_FICHIERS = ['public/boot.js', 'src/firebase.js'];
export const TOUS_FONCTIONS = ['_dockDef', '_dockBuild', '_dockGo', '_railHtml', '_railRubriques', '_railBuild'];
export const COTE_FICHIERS = ['src/coquille.js', 'src/styles.css', 'src/charte.css'];

// Les commentaires blanchis — la règle du preflight, à l'identique (deux outils qui comptent deux choses se disputent).
export function blanc(c) {
  c = c.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  c = c.replace(/(^|[^:'"\\`])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
  return c;
}
const norm = (s) => (s == null ? null : blanc(String(s)).replace(/\s+/g, ' ').trim());

function fin(src, o) {
  let d = 0, q = null;
  for (let j = o; j < src.length; j++) {
    const ch = src[j];
    if (q) { if (ch === '\\') j++; else if (ch === q) q = null; continue; }
    if (ch === '/' && src[j + 1] === '/') { const n = src.indexOf('\n', j); if (n < 0) return -1; j = n; continue; }
    if (ch === '/' && src[j + 1] === '*') { const n = src.indexOf('*/', j + 2); if (n < 0) return -1; j = n + 1; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { q = ch; continue; }
    if (ch === '{') d++;
    else if (ch === '}' && --d === 0) return j + 1;
  }
  return -1;
}
// Les fonctions d'un fichier : { nom, a, b } — les trois écritures (function X(, async function X(, window.X = function).
export function fonctions(src) {
  const out = [], re = /(^|\n)[ \t]*(?:async[ \t]+)?function[ \t]+([A-Za-z_$][\w$]*)[ \t]*\(|window\.([A-Za-z_$][\w$]*)[ \t]*=[ \t]*(?:async[ \t]+)?function\b/g;
  let m;
  while ((m = re.exec(src))) {
    const nom = m[2] || m[3], a = m.index + (m[1] ? m[1].length : 0), o = src.indexOf('{', re.lastIndex);
    if (o < 0) continue;
    const b = fin(src, o);
    if (b > 0) out.push({ nom, a, b });
  }
  return out;
}
const corpsPar = (src) => { const c = {}; fonctions(src).forEach((x) => { c[x.nom] = (c[x.nom] || '') + src.slice(x.a, x.b); }); return c; };
// La liste des tutos : id → { texte, couvre, etiquettes, fin } ; et tout ce qui n'est pas la liste (le moteur, les données).
export function lireTutos(src) {
  const s = src || '', i = s.indexOf('var TU_TUTOS = ['), j = i < 0 ? -1 : s.indexOf('\n];', i);
  if (i < 0 || j < 0) return { tutos: {}, horsListe: s };
  const tutos = {};
  s.slice(i, j).split(/\n  \{ id: '/).slice(1).forEach((p) => {
    const id = p.slice(0, p.indexOf("'")), cv = p.match(/couvre: \[([^\]]*)\]/), fn = p.match(/fin: '([^']*)'/);
    tutos[id] = { texte: p, couvre: cv ? [...cv[1].matchAll(/'([\w$]+)'/g)].map((x) => x[1]) : [], fin: fn ? fn[1] : id,
      etiquettes: [...new Set([...p.matchAll(/\[data-tuto="([\w.-]+)"\]/g)].map((x) => x[1]))] };
  });
  return { tutos, horsListe: s.slice(0, i) + s.slice(j + 3) };
}
const echappe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const reEtiquette = (e) => new RegExp('data-tuto=\\\\{0,2}["\']' + echappe(e) + '\\\\{0,2}["\']', 'g');
// Les fonctions qui portent une étiquette dans un texte (la plus intérieure), et les lignes hors de toute fonction.
function porteurs(src, e) {
  const F = fonctions(src), noms = new Set(), lignes = [];
  for (const m of (src || '').matchAll(reEtiquette(e))) {
    const dedans = F.filter((x) => x.a <= m.index && m.index < x.b).sort((u, v) => v.a - u.a)[0];
    if (dedans) noms.add(dedans.nom);
    else { const a = src.lastIndexOf('\n', m.index) + 1, b = src.indexOf('\n', m.index); lignes.push(src.slice(a, b < 0 ? src.length : b)); }
  }
  return { noms, lignes };
}

// Le cœur, sans git : fichiers changés, et leur texte avant / après (null : absent). Rend { tous, cote, ids, raisons, tousRaisons, total }.
export function concernes({ fichiers, avant, apres }) {
  const R = { tous: false, cote: false, ids: [], raisons: {}, tousRaisons: [], total: 0, fins: {} };
  const F = [...new Set(fichiers || [])];
  const T0 = lireTutos(avant('src/tutos.js')), T1 = lireTutos(apres('src/tutos.js'));
  const ids = Object.keys(T1.tutos);
  R.total = ids.length;
  ids.forEach((id) => { R.fins[id] = T1.tutos[id].fin; });
  const ajoute = (id, r) => { const l = (R.raisons[id] = R.raisons[id] || []); if (!l.includes(r)) l.push(r); };
  const tous = (r) => { R.tous = true; if (!R.tousRaisons.includes(r)) R.tousRaisons.push(r); };
  const change = (f) => norm(avant(f)) !== norm(apres(f));
  F.forEach((f) => {
    if (TOUS_FICHIERS.includes(f) && change(f)) tous(f + ' a changé');
    if (COTE_FICHIERS.includes(f) && change(f)) R.cote = true;
  });
  if (F.includes('src/tutos.js')) {
    if (norm(T0.horsListe) !== norm(T1.horsListe)) tous('le moteur des tutos ou le domaine d’entraînement (tutos.js, hors de la liste des tutos)');
    ids.forEach((id) => { const a = T0.tutos[id]; if (!a) ajoute(id, 'tuto nouveau'); else if (norm(a.texte) !== norm(T1.tutos[id].texte)) ajoute(id, 'sa fiche a changé'); });
  }
  const js = F.filter((f) => /^src\/.+\.js$/.test(f) && f !== 'src/tutos.js');
  const modifiees = new Set();
  js.forEach((f) => {
    const A = corpsPar(avant(f) || ''), B = corpsPar(apres(f) || '');
    new Set([...Object.keys(A), ...Object.keys(B)]).forEach((n) => { if (norm(A[n]) !== norm(B[n])) modifiees.add(n); });
  });
  TOUS_FONCTIONS.forEach((n) => { if (modifiees.has(n)) tous('le chemin vers les modules (' + n + ')'); });
  ids.forEach((id) => {
    const t = T1.tutos[id];
    t.couvre.forEach((n) => { if (modifiees.has(n)) ajoute(id, n + ' a changé'); });
    t.etiquettes.forEach((e) => {
      js.forEach((f) => {
        const pa = porteurs(avant(f) || '', e), pb = porteurs(apres(f) || '', e);
        new Set([...pa.noms, ...pb.noms]).forEach((n) => { if (modifiees.has(n)) ajoute(id, 'le bouton « ' + e + ' » (' + n + ')'); });
        if (pa.noms.size !== pb.noms.size || norm(pa.lignes.join('\n')) !== norm(pb.lignes.join('\n'))) ajoute(id, 'le bouton « ' + e + ' » (' + f + ')');
      });
      if (F.includes('index.html')) {
        const pa = porteurs(avant('index.html') || '', e), pb = porteurs(apres('index.html') || '', e);
        if (norm(pa.lignes.join('\n')) !== norm(pb.lignes.join('\n'))) ajoute(id, 'le bouton « ' + e + ' » (index.html)');
      }
    });
  });
  if (R.tous) { R.cote = true; R.ids = ids.slice(); } else R.ids = ids.filter((id) => R.raisons[id]);
  return R;
}

// (chargé depuis une adresse data: par son harnais : pas de chemin de fichier, on part du dossier courant)
const ICI = (() => { try { return path.dirname(fileURLToPath(import.meta.url)); } catch (e) { return path.join(process.cwd(), 'scripts'); } })(), RACINE = path.resolve(ICI, '..');
// Ce qui a changé dans le dépôt depuis `base` (le dernier commit par défaut), fichiers nouveaux compris.
export function depuisGit(base = 'HEAD', R = RACINE) {
  const git = (...a) => execFileSync('git', a, { cwd: R, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  const fichiers = [...new Set([...git('diff', '--name-only', base).split('\n'), ...git('ls-files', '--others', '--exclude-standard').split('\n')].filter(Boolean))];
  const avant = (f) => { try { return git('show', base + ':' + f); } catch (e) { return null; } };
  const apres = (f) => { const p = path.join(R, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; };
  return concernes({ fichiers, avant, apres });
}
export function texte(r) {
  const L = [];
  if (r.tous) L.push('Tutos concernés : TOUS (' + r.total + ') — ' + r.tousRaisons.join(' ; '));
  else if (!r.ids.length) L.push('Tutos concernés : aucun (' + r.total + ' tutos, aucun ne touche ce changement)');
  else { L.push('Tutos concernés : ' + r.ids.length + ' sur ' + r.total); r.ids.forEach((id) => L.push('  · ' + r.fins[id] + ' (' + id + ') — ' + r.raisons[id].join(' ; '))); }
  L.push('Panneau côte à côte : ' + (r.cote ? 'à rejouer' : 'rien qui le touche'));
  return L.join('\n');
}

let estCommande = false;
try { estCommande = !!process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url); } catch (e) { estCommande = false; }
if (estCommande) {
  const a = process.argv.slice(2), i = a.indexOf('--base'), base = i >= 0 ? a[i + 1] : 'HEAD';
  const r = depuisGit(base);
  console.log(a.includes('--json') ? JSON.stringify(r, null, 2) : texte(r));
}
