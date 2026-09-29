#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais : AUCUNE DONNEE NE FAIT PLANTER LA RÉSERVE (ROB-2)
// ═══════════════════════════════════════════════════════════════════════════
//  Même patron que le Planning, le Pilotage, la Cave et le Tracteur : des domaines
//  tirés au hasard, sains ET abîmés, rendus sur TOUTES les vues ; rouge au premier
//  plantage, à la première erreur journalisée ou avalée, au premier « undefined /
//  NaN / [object Object] / Infinity » affiché.
//
//  LES VUES : Fûts (par millésime, par mode) · Intrants · Bilan matière · la fiche
//  de chaque lot de fûts · la saisie d'un achat, d'un inventaire, d'une séparation ·
//  le document imprimable des intrants et celui du parc · le parc et le registre
//  que la Cave emprunte (_rsvParcHtml, _rsvMouvHtml).
//  LES DONNÉES : le document INTRANTS entier (reserve.js) — produits (conso tirée du
//  registre phyto, du Cuvier ou saisie), achats (prix connu, à venir, 0), inventaires,
//  lots de fûts (achat / location), registre du parc (fut_mouv, sept motifs), et les
//  listes de noms mémorisés (fournisseurs, références) — plus la cave qu'ils servent.
//  Chargeur : scripts/mv-app-node.mjs.
//
//  Usage :
//    node scripts/mv-harnais-robustesse-reserve.mjs            # 12 domaines
//    node scripts/mv-harnais-robustesse-reserve.mjs --long     # 100 domaines
//    node scripts/mv-harnais-robustesse-reserve.mjs --contre   # contre-épreuves
//  Jamais déployé (scripts/) -> aucun bump.
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { chargerApp } from './mv-app-node.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const ARGS = process.argv.slice(2);
const CONTRE = ARGS.includes('--contre');
const N = ARGS.includes('--long') ? 100 : 12;
const REMPLACE = {};
for (const x of String(process.env.MV_ROB_REMPLACE || '').split(';').filter(Boolean)) { const [k, v] = x.split('='); REMPLACE[k] = v; }

if (CONTRE) {
  const DEFAUTS = [
    ['reserve.js', 'la fiche d\u2019un lot lit un champ du premier fût sans garde',
      'function _rsvOpenFut(id){\n', 'function _rsvOpenFut(id){\n  var __f=INTRANTS.futs[0].ref.length;\n'],
    ['reserve.js', 'une erreur journalisée à chaque rendu du corps',
      'function _rsvRenderBody(){\n', "function _rsvRenderBody(){\n  if(window.logError) window.logError({level:'error',cat:'reserve',msg:'contre-epreuve'});\n"],
    ['app.js', 'LISTES-1 ne regarde plus dans le document des intrants',
      "  intrants:['produits','achats','inventaires','futs','fut_mouv']};", "  _intrants_retire:['produits']};"],
    ['reserve.js', 'un « NaN » dans le document imprimable',
      'function _rsvDoc(c){\n', "function _rsvDoc(c){\n  if(window._mvDocOpen) window._mvDocOpen({titre:'x', html:'NaN'}); return;\n"],
  ];
  let ok = 0, ko = 0;
  console.log('\nContre-épreuves — chaque défaut reposé doit rougir');
  for (const [mod, nom, a, b] of DEFAUTS) {
    let s = fs.readFileSync(path.join(RACINE, 'src', mod), 'utf8');
    if (s.split(a).length !== 2) { ko++; console.log('   ROUGE  défaut non posé (ancre introuvable ou multiple) : ' + nom); continue; }
    s = s.replace(a, b);
    const f = path.join(os.tmpdir(), 'mv-robrsv-' + process.pid + '-' + ok + ko + '.js');
    fs.writeFileSync(f, s);
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, MV_ROB_REMPLACE: mod + '=' + f }, encoding: 'utf8', timeout: 240000 });
    fs.unlinkSync(f);
    if (r.status !== 0 && /ROUGE/.test(r.stdout || '')) { ok++; console.log('   vert   rougit : ' + nom); }
    else { ko++; console.log('   ROUGE  RESTE VERT : ' + nom + '\n' + String(r.stdout || '').slice(-500) + String(r.stderr || '').slice(-500)); }
  }
  console.log('\n──────────────────────────────\n  ' + ok + ' vert · ' + ko + ' rouge');
  process.exit(ko ? 1 : 0);
}

const A = await chargerApp({ remplace: REMPLACE });
const { G, JOURNAL_ERR, sale, poser, ecran, viderEcran } = A;
G.openPrompt = () => {};
// Le document imprimable passe par window._mvDocOpen({titre, html…}), qui ouvre une fenêtre : on garde ce qu'il
// reçoit et on le lit comme un écran (toutes ses valeurs texte).
let DOC = '';
G._mvDocOpen = o => { DOC = Object.values(o || {}).filter(v => typeof v === 'string').join('\n'); return true; };

let ok = 0, ko = 0;
const T = (nom, c, d) => { if (c) ok++; else { ko++; console.log('   ROUGE  ' + nom + (d ? '  → ' + d : '')); } };
for (const n of ['renderReserve', '_rsvTabTo', '_rsvOpenFut', '_rsvOpenAchat', '_rsvOpenInv', '_rsvOpenSep', '_rsvSetFutYear', '_rsvDoc', '_rsvExportFutsPdf', '_rsvParcHtml', '_rsvMouvHtml'])
  T('la Réserve expose ' + n, typeof G[n] === 'function');

// Le document imprimable : _rsvDoc rend du HTML — on le lit tel quel.
const VUES = [
  ['Fûts', () => G._rsvTabTo('futs')],
  ['Fûts › tous les millésimes', () => { G._rsvTabTo('futs'); G._rsvSetFutYear('all'); }],
  ['Fûts › millésime 2024', () => { G._rsvTabTo('futs'); G._rsvSetFutYear(2024); }],
  ['Intrants', () => G._rsvTabTo('intrants')],
  ['Bilan matière', () => G._rsvTabTo('audit')],
  ['saisie d\u2019un achat', () => { G._rsvTabTo('intrants'); G._rsvOpenAchat(); }],
  ['saisie d\u2019un inventaire', () => { G._rsvTabTo('intrants'); G._rsvOpenInv(); }],
  ['séparation d\u2019un fût', () => { G._rsvTabTo('futs'); G._rsvOpenSep(); }],
  ['nouveau lot de fûts', () => { G._rsvTabTo('futs'); G._rsvOpenFut(); }],
  ['parc (emprunté par la Cave)', () => { const el = document.getElementById('x-parc'); el.innerHTML = G._rsvParcHtml(); }],
  ['registre (emprunté par la Cave)', () => { const el = document.getElementById('x-mouv'); el.innerHTML = G._rsvMouvHtml(); }],
];
function jouer(lib, geste, echec) {
  viderEcran();
  const j0 = JOURNAL_ERR.length;
  try { geste(); for (const x of sale(ecran())) echec(lib, x); }
  catch (e) { echec(lib, e.message + ' @ ' + String((e.stack || '').split('\n')[1] || '').trim().replace(/.*\//, '')); }
  for (const o of JOURNAL_ERR.slice(j0)) echec(lib, 'erreur journalisée : ' + String(o.msg || o.cat || '').slice(0, 140));
}
function docs(echec) {
  // Le document des intrants et celui du parc : du HTML rendu par une fonction, lu sans l'ouvrir.
  const DOCS = [['intrants par nom', () => G._rsvDoc({ cle: 'nom', sens: 'asc' })], ['intrants par écart', () => G._rsvDoc({ cle: 'coherence', sens: 'desc' })],
    ['intrants par stock', () => G._rsvDoc({ cle: 'stock', sens: 'asc' })], ['parc de fûts', () => G._rsvExportFutsPdf()]];
  for (const [c, faire] of DOCS) {
    const j0 = JOURNAL_ERR.length;
    DOC = '';
    try { const h = faire(); for (const x of sale(DOC + (typeof h === 'string' ? h : ''))) echec('document ' + c, x); }
    catch (e) { echec('document ' + c, e.message + ' @ ' + String((e.stack || '').split('\n')[1] || '').trim().replace(/.*\//, '')); }
    for (const o of JOURNAL_ERR.slice(j0)) echec('document ' + c, 'erreur journalisée : ' + String(o.msg || o.cat || '').slice(0, 140));
  }
}
function toutJouer(echec) {
  for (const [v, g] of VUES) jouer(v, g, echec);
  for (const f of ((G.INTRANTS || {}).futs || [])) if (f && f.id) jouer('fiche lot', () => { G._rsvTabTo('futs'); G._rsvOpenFut(f.id); }, echec);
  docs(echec);
}
function cles(d) {
  return { membres: [{ nom: 'Nico', statut: 'Actif', roles: ['admin'] }], parcelles: d.parcelles || [], config: d.config || {},
    saisons: [{ nom: 'Printemps 2026', active: true, debut: '2026-03-16', fin: '2026-10-31' }],
    intrants: d.intrants || {}, traitements: d.traitements || [], catalogue: d.catalogue || [],
    cave_elevage: d.ce || { cuvees: [], operations: [], analyses: [], config: {} }, cave_vendange: d.cv || {} };
}

// ═══ A. BASE VIDE, BASE FIXE ════════════════════════════════════════════════
console.log('\nA. Chaque vue sur une base vide, puis sur une base fixe');
const FIXE = {
  intrants: {
    produits: [{ id: 'p1', nom: 'Bouillie bordelaise', cat: 'phyto', unite: 'kg', contenance: 10, contLbl: 'sac 10 kg', prixU: 4.2, conso_src: 'registre' },
      { id: 'p2', nom: 'Métabisulfite', cat: 'oeno', unite: 'g', contenance: 1000, contLbl: 'boîte 1 kg', prixU: 0.02, conso_src: 'manual', conso_manuel: 500 }],
    achats: [{ id: 'a1', prodId: 'p1', date: '2026-03-02', four: 'Coop', q: 50, unites: 5, lot: 'L24', fact: 'F-12', prix: 210 }],
    inventaires: [{ prodId: 'p1', date: '2026-01-05', q: 12 }],
    futs: [{ id: 'f1', mode: 'achat', four: 'Tonnellerie Rousseau', ref: 'Chêne fin', annee: 2024, qte: 6, date: '2024-09-01', dfact: '2024-09-15', prix: 5400 },
      { id: 'f2', mode: 'loc', four: 'Tonnellerie Martin', ref: 'Location', annee: 2025, qte: 2, loyer: 120, debut: '2025-09-01', fin: '2026-08-31' }],
    fut_mouv: [{ id: 'm1', date: '2024-09-01', sens: 'entree', motif: 'achat', four: 'Tonnellerie Rousseau', ref: 'Chêne fin', annee: 2024, nb: 6, note: '' },
      { id: 'm2', date: '2026-04-10', sens: 'sortie', motif: 'vente', four: 'Tonnellerie Rousseau', ref: 'Chêne fin', annee: 2024, nb: 1, note: 'voisin' }],
    fut_four: ['Tonnellerie Rousseau', 'Tonnellerie Martin'], fut_ref: ['Chêne fin'], achat_four: ['Coop'] },
};
for (const [lib, d] of [['vide', {}], ['fixe', FIXE]]) {
  poser(cles(d));
  const E = [];
  toutJouer((q, m) => E.push(q + ' — ' + m));
  T('A · base ' + lib + ' : toutes les vues sans plantage ni valeur sale', E.length === 0, E.slice(0, 8).join(' | '));
  if (lib === 'fixe') {
    viderEcran(); G._rsvTabTo('intrants');
    T('A · base fixe : les intrants montrent les produits', /Bouillie bordelaise/.test(ecran()));
    viderEcran(); G._rsvTabTo('futs'); G._rsvSetFutYear('all');
    T('A · base fixe : les fûts montrent le tonnelier', /Tonnellerie Rousseau/.test(ecran()));
    DOC = ''; G._rsvDoc({ cle: 'nom', sens: 'asc' });
    T('A · base fixe : le document imprimable porte les intrants et le parc', /Bouillie bordelaise/.test(DOC) && /Chêne fin/.test(DOC), DOC.slice(0, 160));
  }
}

// ═══ B. DES DOMAINES TIRÉS AU HASARD ════════════════════════════════════════
console.log('\nB. ' + N + ' domaines tirés au hasard × ' + VUES.length + ' vues + chaque lot + 4 documents');
let graine = 1; const rnd = () => { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine / 0x7fffffff; };
const pick = a => a[Math.floor(rnd() * a.length)];
const iso = (y, m, d) => y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
const vraiJour = () => iso(pick([2023, 2024, 2025, 2026]), Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28));
const unJour = () => rnd() < .05 ? pick([undefined, '']) : vraiJour();
const MOTIFS = { achat: 'entree', embouteille: 'entree', retrait: 'entree', entonnage: 'sortie', vente: 'sortie', retour: 'sortie', destruction: 'sortie' };
function domaine() {
  const produits = [];
  for (let i = 0; i < Math.floor(rnd() * 8); i++) {
    const p = { id: 'p' + i, nom: pick(['Bouillie bordelaise', 'Soufre mouillable', 'Métabisulfite', 'Levures', 'Tanin', '']) + ' ' + i, cat: pick(['phyto', 'oeno', 'vigne', 'cave', 'trac', 'gen']),
      unite: pick(['kg', 'L', 'g', 'u']),   // cat et unité viennent de listes déroulantes : jamais absentes contenance: pick([10, 1, 1000, '5', null, undefined]), contLbl: pick(['sac 10 kg', '', undefined]),
      prixU: pick([4.2, 0, '3,5', null, undefined]), conso_src: pick(['registre', 'cuvier', 'manual', undefined]) };
    if (p.conso_src === 'manual') p.conso_manuel = pick([500, 0, '12', null]);
    if (rnd() < .2) { p.mode = pick(['ephy', 'man']); if (p.mode === 'ephy') p.amm = pick(['2010123', undefined]); }
    produits.push(p);
  }
  const P = produits.map(p => p.id);
  const achats = [];
  for (let i = 0; i < Math.floor(rnd() * 10); i++) achats.push({ id: 'a' + i, prodId: pick(P.concat(['disparu'])), date: unJour(), four: pick(['Coop', '', undefined]),
    q: pick([50, 1, '12', 0, null]), unites: pick([5, 1, null, undefined]), lot: pick(['L24', '', undefined]), fact: pick(['F-12', '', undefined]), prix: pick([210, 0, '180', null, undefined]) });
  const inventaires = [];
  for (let i = 0; i < Math.floor(rnd() * 5); i++) inventaires.push({ prodId: pick(P.concat(['disparu'])), date: unJour(), q: pick([12, 0, '3', null]) });
  const futs = [];
  for (let i = 0; i < Math.floor(rnd() * 6); i++) {
    const loc = rnd() < .3;
    const f = { id: 'f' + i, mode: loc ? 'loc' : pick(['achat', undefined]), four: pick(['Tonnellerie Rousseau', 'Tonnellerie Martin', '']), ref: pick(['Chêne fin', 'Grain moyen', '', undefined]),
      annee: pick([2022, 2024, 2025, '2025', undefined]), qte: pick([6, 1, 12, '4', 0]), date: unJour() };
    if (loc) { f.loyer = pick([120, '90', null]); f.debut = unJour(); f.fin = unJour(); } else { f.prix = pick([5400, 0, '900', null, undefined]); f.dfact = unJour(); }
    futs.push(f);
  }
  const fut_mouv = [];
  for (let i = 0; i < Math.floor(rnd() * 10); i++) {
    const motif = pick(Object.keys(MOTIFS));
    fut_mouv.push({ id: 'm' + i, date: vraiJour(), sens: MOTIFS[motif], motif, four: pick(['Tonnellerie Rousseau', '']), ref: pick(['Chêne fin', '']), annee: pick([2022, 2024, 2025]), nb: pick([1, 2, 6]), note: pick(['', 'voisin']) });
  }
  const intrants = pick([
    { produits, achats, inventaires, futs, fut_mouv, fut_four: ['Tonnellerie Rousseau'], fut_ref: ['Chêne fin'], achat_four: ['Coop'] },
    { produits, achats, futs },                                      // document d'avant fut_mouv / inventaires
    { produits: null, achats: 'x', futs: [] },                       // sous-listes abîmées : _rsvApply les remet à []
    {}]);
  // Un élément étranger DANS une sous-liste d'objets (écriture interrompue, vieille version).
  for (const k of ['produits', 'achats', 'inventaires', 'futs', 'fut_mouv']) if (Array.isArray(intrants[k]) && rnd() < .08) intrants[k].push(pick([null, 'x', 0, []]));
  const traitements = [];
  for (let i = 0; i < Math.floor(rnd() * 5); i++) traitements.push({ id: 't' + i, date: unJour(), parcelles: pick([['Clos Bas'], [], null]), produits: pick([[{ nom: produits[0] ? produits[0].nom : 'Cuivre', dose: pick([0.5, '1', null]), unite: 'kg/ha' }], [], null]), surface: pick([1.1, null]) });
  const ce = { cuvees: pick([[{ id: 'c1', nom: 'Gevrey VV', millesime: 2025, tonneaux: [{ annee: 2024, nb: 4 }], statut: 'elevage' }], []]), operations: [], analyses: [], config: {} };
  return { intrants, traitements, ce, parcelles: [{ nom: 'Clos Bas', surface: 1.1, statut: 'Actif', taches: {} }] };
}
const ECHECS = new Map();
const note = (quoi, s, msg) => { if (!ECHECS.has(msg)) ECHECS.set(msg, { s, quoi, vues: new Set() }); ECHECS.get(msg).vues.add(quoi); };
for (let s = 1; s <= N; s++) {
  graine = s;
  poser(cles(domaine()));
  A.setAuj(pick([[2026, 8, 27], [2026, 0, 3], [2025, 11, 31]]));
  toutJouer((q, m) => note(q, s, m));
}
T('B1 · ' + N + ' domaines : aucun plantage, aucune erreur journalisée ou avalée, rien de sale à l\u2019écran', ECHECS.size === 0,
  [...ECHECS].slice(0, 15).map(([k, v]) => '\n        graine ' + v.s + ', ' + v.quoi + (v.vues.size > 1 ? ' (+' + (v.vues.size - 1) + ' vues)' : '') + ' — ' + k).join(''));

console.log('\n──────────────────────────────\n  ' + ok + ' vert · ' + ko + ' rouge');
process.exit(ko ? 1 : 0);
