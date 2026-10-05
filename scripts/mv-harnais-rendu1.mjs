// HARNAIS — RENDU-1 (§245) : un rendu, de la seule page affichée, par image.
//   node scripts/mv-harnais-rendu1.mjs           → doit être vert
//   node scripts/mv-harnais-rendu1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute la VRAIE _mvRendreBientot (et sa table _MV_RENDU_PAGES) de firebase.js dans un vm, avec une horloge d'images
// simulée (requestAnimationFrame capturé). Mesure Chromium : §245c.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const FB = fs.readFileSync(path.join(R, 'src/firebase.js'), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function entre(src, debut, fin) {
  const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut);
  if (src.indexOf(debut, i + 1) >= 0) throw new Error('en double : ' + debut);
  const j = src.indexOf(fin, i + debut.length); if (j < 0) throw new Error('fin introuvable après : ' + debut);
  return src.slice(i, j + fin.length);
}
const BASE = {
  rendu: sansCom(entre(FB, 'var _MV_RENDU_PAGES = {', 'window._mvRendreBientot = _mvRendreBientot;')),
  abo: sansCom(entre(FB, 'function _fbSubscribe(key) {', '\n}\n')),
  online: sansCom(entre(FB, "window.addEventListener('online', function () {\n  if(DEBUG) console.log('[Réseau] Connexion rétablie');", '\n});\n')),
};
function monde(B, page, o) {
  o = o || {};
  const images = [], appels = { home: 0, parc: 0, stats: 0, jour: 0, tract: 0, phyto: 0, plan: 0, avale: 0 };
  const ctx = {
    requestAnimationFrame: f => { images.push(f); return images.length; }, setTimeout: f => { images.push(f); return images.length; },
    document: { querySelector: () => (page ? { id: page } : null) },
  };
  ctx.window = ctx;
  ctx.currentUser = o.personne === false ? null : { nom: 'Nico' };
  ctx.renderHome = () => { appels.home++; if (o.panne) throw new Error('panne'); };
  ctx.renderParcelles = () => { appels.parc++; }; ctx.computePStats = () => { appels.stats++; };
  ctx.renderJournalList = () => { appels.jour++; }; ctx.renderTracteur = () => { appels.tract++; };
  ctx.renderPhyto = () => { appels.phyto++; }; ctx.renderPlanning = () => { appels.plan++; };
  ctx._mvAvale = () => { appels.avale++; };
  vm.createContext(ctx); vm.runInContext(B.rendu, ctx);
  const image = () => { const f = images.splice(0); f.forEach(x => x()); return f.length; };
  return { ctx, appels, image, images };
}
function suite(B) {
  const out = [], T = (n, ok) => out.push([n, !!ok]);
  // Un collègue valide : parcelles, journal et travaux arrivent d'affilée.
  let m = monde(B, 'page-home'); ['parcelles', 'journal', 'travaux'].forEach(k => m.ctx._mvRendreBientot(k));
  T('trois documents reçus : rien n’est redessiné pendant la réception', m.appels.home === 0 && m.images.length === 1);
  m.image();
  T('… l’Accueil affiché se redessine UNE fois, à l’image suivante', m.appels.home === 1);
  T('… les pages cachées ne sont pas redessinées (Parcelles, statistiques, Journal)', m.appels.parc === 0 && m.appels.stats === 0 && m.appels.jour === 0);
  m = monde(B, 'page-parcelles'); ['parcelles', 'journal', 'travaux'].forEach(k => m.ctx._mvRendreBientot(k)); m.image();
  T('Parcelles affichée : Parcelles et ses statistiques, une fois ; jamais l’Accueil', m.appels.parc === 1 && m.appels.stats === 1 && m.appels.home === 0);
  m = monde(B, 'page-journal'); ['parcelles', 'journal'].forEach(k => m.ctx._mvRendreBientot(k)); m.image();
  T('Journal affiché : la liste du journal, une fois ; ni l’Accueil ni Parcelles', m.appels.jour === 1 && m.appels.home === 0 && m.appels.parc === 0);
  m = monde(B, 'page-tracteur'); m.ctx._mvRendreBientot('journal'); m.image();
  T('Tracteur affiché, journal reçu : rien à redessiner', m.appels.tract === 0 && m.appels.home === 0);
  m.ctx._mvRendreBientot('sessions'); m.image();
  T('Tracteur affiché, sessions reçues : Tracteur redessiné', m.appels.tract === 1);
  m = monde(B, 'page-phyto'); m.ctx._mvRendreBientot('catalogue'); m.image();
  T('Phyto affiché, catalogue reçu : Phyto redessiné', m.appels.phyto === 1);
  m = monde(B, 'page-planning'); m.ctx._mvRendreBientot('planning_entries'); m.image();
  T('Planning affiché, planning reçu : Planning redessiné', m.appels.plan === 1);
  m = monde(B, 'page-planning'); m.ctx._mvRendreBientot('*'); m.image();
  T('après une relecture complète (« * ») : la page affichée, quelle qu’elle soit', m.appels.plan === 1);
  m = monde(B, 'page-home', { personne: false }); m.ctx._mvRendreBientot('journal'); m.image();
  T('personne de connecté : rien n’est dessiné', m.appels.home === 0);
  m = monde(B, 'page-home'); m.ctx._mvRendreBientot('journal'); m.image(); m.ctx._mvRendreBientot('journal'); m.image();
  T('deux réceptions à deux images différentes : deux rendus (rien n’est avalé)', m.appels.home === 2);
  m = monde(B, 'page-home', { panne: true }); m.ctx._mvRendreBientot('journal'); m.image(); m.ctx._mvRendreBientot('journal'); m.image();
  T('un rendu en panne est tracé, et le suivant a quand même lieu', m.appels.avale === 2 && m.appels.home === 2);
  T('les documents reçus passent par le rendu groupé, plus par des rendus directs',
    /window\._mvRendreBientot\(key\)/.test(B.abo) && !/window\.renderHome\(\)|window\.renderParcelles\(\)/.test(B.abo));
  T('la relecture complète au retour du réseau aussi', /_mvRendreBientot\('\*'\)/.test(B.online) && !/window\.renderHome\(\)/.test(B.online));
  return out;
}
function joue(B) { try { return suite(B); } catch (e) { return [['plantage : ' + (e && e.message), false]]; } }
let ok = 0, ko = 0;
joue(BASE).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nRENDU-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const DEF = [
  ['chaque document redessine aussitôt (pas de regroupement)', B => ({ ...B, rendu: B.rendu.replace('if (_mvRenduImage) return;', 'if (false) return;') })],
  ['l’Accueil est redessiné même quand Parcelles est affichée', B => ({ ...B, rendu: B.rendu.replace("rendre: function () { if (window.renderParcelles) window.renderParcelles();", "rendre: function () { if (window.renderHome) window.renderHome(); if (window.renderParcelles) window.renderParcelles();") })],
  ['la page affichée n’est plus consultée (toutes redessinées)', B => ({ ...B, rendu: B.rendu.replace('var p = document.querySelector(\'.page.active\'), P = p && _MV_RENDU_PAGES[p.id];', "var p = { id: 'page-home' }, P = _MV_RENDU_PAGES['page-home']; if (window.renderParcelles) window.renderParcelles();") })],
  ['l’horloge est remise à zéro APRÈS le rendu (une panne enraye la suite)', B => ({ ...B, rendu: B.rendu
    .replace('var cles = _mvRenduCles; _mvRenduCles = {}; _mvRenduImage = 0;', 'var cles = _mvRenduCles; _mvRenduCles = {};')
    .replace("try { P.rendre(); } catch (e) {", "P.rendre(); _mvRenduImage = 0; try { } catch (e) {") })],
  ['la relecture complète ne redessine plus rien', B => ({ ...B, rendu: B.rendu.replace("cles['*'] || ", '') })],
  ['les documents reçus repassent par les rendus directs', B => ({ ...B, abo: B.abo.replace('window._mvRendreBientot(key);', 'window.renderHome(); window.renderParcelles();') })],
];
let rg = 0;
for (const [n, f] of DEF) {
  const B2 = f(BASE);
  if (Object.keys(BASE).every(k => B2[k] === BASE[k])) { console.log('  ⚠ non injecté : ' + n); continue; }
  const rouge = joue(B2).some(([, x]) => !x); if (rouge) rg++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
}
console.log(`\n${rg}/${DEF.length} contre-épreuves rougissent`);
process.exit(rg === DEF.length ? 0 : 1);
