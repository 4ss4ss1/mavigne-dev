#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais : AUCUNE DONNEE NE FAIT PLANTER LA CAVE NI LE CUVIER (ROB-2)
// ═══════════════════════════════════════════════════════════════════════════
//  Même patron que le Planning (§191) et le Pilotage (28/09) : des domaines tirés au
//  hasard, sains ET abîmés, rendus sur TOUTES les vues ; rouge au premier plantage,
//  à la première erreur journalisée ou avalée, au premier « undefined / NaN /
//  [object Object] / Infinity » affiché.
//
//  LES VUES : Aujourd'hui · Réglages · Le millésime (ligne de vie, courbes) · Le Chai
//  (cuvées, journal, bouteilles) · Le Cuvier (récoltes, cuves, maturité, tournée) ·
//  la fiche de chaque cuvée.
//  LES DONNÉES : cuvées (en élevage, en bouteille, d'avant), opérations (ouillage,
//  soufre, soutirage, analyse, types inconnus), analyses de labo, récoltes (parts
//  domaine / vendu, retours client, groupes RET-G), cuves de vinification (fusion,
//  historique d'étapes), contrôles de maturité, fûts de la Réserve, parcelles.
//  L'application entière est chargée par scripts/mv-app-node.mjs (chargeur partagé).
//
//  Usage :
//    node scripts/mv-harnais-robustesse-cave.mjs            # 12 domaines
//    node scripts/mv-harnais-robustesse-cave.mjs --long     # 100 domaines
//    node scripts/mv-harnais-robustesse-cave.mjs --contre   # contre-épreuves
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
// MV_ROB_REMPLACE = "cave.js=/tmp/x.js" : un module remplacé par une copie à défaut (contre-épreuves).
const REMPLACE = {};
for (const x of String(process.env.MV_ROB_REMPLACE || '').split(';').filter(Boolean)) { const [k, v] = x.split('='); REMPLACE[k] = v; }

if (CONTRE) {
  const DEFAUTS = [
    ['cave.js', 'le Chai lit la première cuvée sans vérifier qu\u2019il y en a une',
      'function renderCaveCuvees() {\n', 'function renderCaveCuvees() {\n  var __c=((window.CAVE_ELEVAGE||{}).cuvees||[])[0].nom;\n'],
    ['cave.js', 'la fiche d\u2019une cuvée lit un champ d\u2019un objet absent',
      'function openCuveeDetail(', 'function __od(){ return null; }\nfunction openCuveeDetail('],
    ['cuvier.js', 'une erreur journalisée à chaque onglet du Cuvier',
      'function _vendRenderTab(){\n', "function _vendRenderTab(){\n  if(window.logError) window.logError({level:'error',cat:'cuvier',msg:'contre-epreuve'});\n"],
    ['app.js', 'LISTES-1 ne regarde plus dans les documents de la Cave',
      "  if(_MV_SOUS_LISTES[key] && value", "  if(false && _MV_SOUS_LISTES[key] && value"],
    ['cuvier.js', 'un « NaN » dans le Cuvier',
      'function _vendRenderTab(){\n', "function _vendRenderTab(){\n  var __b=document.getElementById('mvv-body'); if(__b) setTimeout(function(){},0), __b.textContent+=' '+(0/0);\n"],
  ];
  // Le 2ᵉ défaut s'écrit après coup : openCuveeDetail doit appeler __od().x
  let ok = 0, ko = 0;
  console.log('\nContre-épreuves — chaque défaut reposé doit rougir');
  for (const [mod, nom, a, b] of DEFAUTS) {
    let s = fs.readFileSync(path.join(RACINE, 'src', mod), 'utf8');
    if (s.split(a).length !== 2) { ko++; console.log('   ROUGE  défaut non posé (ancre introuvable ou multiple) : ' + nom); continue; }
    s = s.replace(a, b);
    if (b.indexOf('__od') !== -1) {
      const i = s.indexOf('function openCuveeDetail(');
      const j = s.indexOf('{', i);
      s = s.slice(0, j + 1) + '\n  var __z=__od().champ;' + s.slice(j + 1);
    }
    const f = path.join(os.tmpdir(), 'mv-robcave-' + process.pid + '-' + ok + ko + '.js');
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

let ok = 0, ko = 0;
const T = (nom, c, d) => { if (c) ok++; else { ko++; console.log('   ROUGE  ' + nom + (d ? '  → ' + d : '')); } };
const EXPOSE = ['renderCave', 'selectCaveSection', 'switchCaveOng', 'switchVendOng', '_mlSetTab', 'openCuveeDetail'];
for (const n of EXPOSE) T('la Cave expose ' + n, typeof G[n] === 'function');

// Les vues : [libellé, geste]
const VUES = [
  ['Aujourd\u2019hui', () => G.selectCaveSection('aujourdhui')],
  ['Réglages', () => G.selectCaveSection('reglages')],
  ['Millésime › ligne de vie', () => { G.selectCaveSection('millesime'); G._mlSetTab('vie'); }],
  ['Millésime › courbes', () => { G.selectCaveSection('millesime'); G._mlSetTab('crb'); }],
  ['Chai › cuvées', () => { G.selectCaveSection('elevage'); G.switchCaveOng('cuv'); }],
  ['Chai › journal', () => { G.selectCaveSection('elevage'); G.switchCaveOng('journal'); }],
  ['Chai › bouteilles', () => { G.selectCaveSection('elevage'); G.switchCaveOng('bouteille'); }],
  ['Cuvier › récoltes', () => { G.selectCaveSection('vendange'); G.switchVendOng('rec'); }],
  ['Cuvier › cuves', () => { G.selectCaveSection('vendange'); G.switchVendOng('cuves'); }],
  ['Cuvier › maturité', () => { G.selectCaveSection('vendange'); G.switchVendOng('ana'); }],
  ['Cuvier › tournée', () => { G.selectCaveSection('vendange'); G.switchVendOng('tour'); }],
];
function jouer(lib, geste, echec) {
  viderEcran();
  const j0 = JOURNAL_ERR.length;
  try { geste(); for (const x of sale(ecran())) echec(lib, x); }
  catch (e) { echec(lib, e.message + ' @ ' + String((e.stack || '').split('\n')[1] || '').trim().replace(/.*\//, '')); }
  for (const o of JOURNAL_ERR.slice(j0)) echec(lib, 'erreur journalisée : ' + String(o.msg || o.cat || '').slice(0, 140));
}
function cles(d) {
  return { membres: d.membres || [{ nom: 'Nico', statut: 'Actif', roles: ['admin'] }], parcelles: d.parcelles || [], config: d.config || {},
    saisons: d.saisons || [{ nom: 'Vendanges 2026', active: true, debut: '2026-08-01', fin: '2026-10-31' }],
    cave_elevage: d.ce || { cuvees: [], operations: [], analyses: [], config: {} }, cave_vendange: d.cv || {}, intrants: d.intrants || {} };
}

// ═══ A. BASE VIDE, BASE FIXE ════════════════════════════════════════════════
console.log('\nA. Chaque vue sur une base vide, puis sur une base fixe');
const FIXE = {
  parcelles: [{ nom: 'Les Grandes Vignes', surface: 0.42, statut: 'Actif', cepage: 'Pinot noir', appellation: 'Gevrey-Chambertin', taches: {} },
    { nom: 'Clos Bas', surface: 1.1, statut: 'Actif', cepage: 'Pinot noir', taches: {} }],
  ce: { cuvees: [{ id: 'c1', nom: 'Gevrey VV', millesime: 2025, tonneaux: [{ annee: 2024, nb: 6 }], statut: 'elevage', fml_terminee: true, fml_terminee_date: '2026-04-02', last_ouillage: '2026-09-10' },
    { id: 'c2', nom: 'Bourgogne rouge', millesime: 2024, tonneaux: [], statut: 'embouteille', nb_bouteilles: 2400, date_embouteillage: '2026-03-15' }],
    operations: [{ id: 'o1', type: 'ouillage', date: '2026-09-10', cuvee_id: 'c1', cuvees_ids: ['c1'], operateur: 'Nico', intervenants: [], notes: '', data: { nb_ouillettes: 6, vol_ouillette_L: 1, vol_total_L: 6 } }],
    analyses: [], config: { ouillage_alerte_j: 14 } },
  cv: { recoltes: [{ id: 'r1', parcelle: 'Clos Bas', date: '2026-09-15', parts: [{ dom: true, caisses: 120, pck: 25 }], nb_caisses: 120, cuvee: 'Gevrey VV', cuve_id: 'k1' }],
    cuves_vinif: [{ id: 'k1', nom: 'Cuve 1', volume_hl: 22, statut: 'ferm', parcelles: ['Clos Bas'], date_entree: '2026-09-15', recolte_ids: ['r1'], statut_hist: [{ statut: 'ferm', le: '2026-09-15' }] }],
    analyses: [{ id: 'a1', parcelle: 'Les Grandes Vignes', date: '2026-09-01', mode: 'sucre', val: 190 }, { id: 'a2', parcelle: 'Les Grandes Vignes', date: '2026-09-07', mode: 'sucre', val: 205 }] },
};
for (const [lib, d] of [['vide', {}], ['fixe', FIXE]]) {
  poser(cles(d));
  const E = [];
  for (const [v, g] of VUES) jouer(v, g, (q, m) => E.push(q + ' — ' + m));
  for (const c of ((d.ce || {}).cuvees || [])) jouer('fiche ' + c.id, () => G.openCuveeDetail(c.id), (q, m) => E.push(q + ' — ' + m));
  T('A · base ' + lib + ' : ' + VUES.length + ' vues sans plantage ni valeur sale', E.length === 0, E.slice(0, 8).join(' | '));
  if (lib === 'fixe') {
    // Un écran vide est toujours propre : on vérifie que les données ARRIVENT.
    viderEcran(); G.selectCaveSection('elevage'); G.switchCaveOng('cuv');
    T('A · base fixe : le Chai montre la cuvée en élevage', /Gevrey VV/.test(ecran()));
    viderEcran(); G.selectCaveSection('vendange'); G.switchVendOng('cuves');
    T('A · base fixe : le Cuvier montre la cuve de vinification', /Cuve 1/.test(ecran()));
    viderEcran(); G.selectCaveSection('vendange'); G.switchVendOng('rec');
    T('A · base fixe : le Cuvier montre la récolte', /Clos Bas/.test(ecran()));
  }
}

// ═══ B. DES DOMAINES TIRÉS AU HASARD ════════════════════════════════════════
console.log('\nB. ' + N + ' domaines tirés au hasard × ' + VUES.length + ' vues + la fiche de chaque cuvée');
let graine = 1; const rnd = () => { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine / 0x7fffffff; };
const pick = a => a[Math.floor(rnd() * a.length)];
const iso = (y, m, d) => y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
const unJour = () => rnd() < .04 ? pick([undefined, '', null, '2026-13-40', 'hier']) : iso(pick([2024, 2025, 2026, 2026]), Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28));
const nombre = () => pick([0, 0.5, 1.2, 6, 22, 120, 2400, '12', '1,5', null, undefined, -3]);
function domaine() {
  const parcelles = [];
  for (let i = 0; i < 1 + Math.floor(rnd() * 7); i++) parcelles.push({ nom: pick(['Les Grandes Vignes', 'Clos Bas', 'En Champs', 'La Justice', 'Parcelle ' + i]) + (rnd() < .3 ? ' ' + i : ''),
    surface: nombre(), statut: pick(['Actif', 'Actif', 'Arrachee', undefined]), cepage: pick(['Pinot noir', 'Chardonnay', '', null, undefined]),
    appellation: pick(['Gevrey-Chambertin', 'Bourgogne', 'Côte de Nuits-Villages', null, undefined]), taches: {}, rdt_hist: pick([undefined, { 2025: 38 }, { 2024: '35' }, null]) });
  if (rnd() < .06) parcelles.push(pick([null, 'x', {}]));
  const P = parcelles.filter(p => p && p.nom).map(p => p.nom);
  const cuvees = [];
  for (let i = 0; i < Math.floor(rnd() * 6); i++) {
    // Contenants : la forme du jour est une LISTE de lots {nb, …} ; celle d'avant, un nombre `nb_tonneaux`.
    const c = { id: 'c' + i, nom: pick(['Gevrey VV', 'Bourgogne', 'Aligoté', 'Clos', '']) + ' ' + i, millesime: pick([2023, 2024, 2025, '2025', null, undefined]),
      statut: pick(['elevage', 'elevage', 'embouteille', 'assemblee', undefined, 'inconnu']), fml_terminee: pick([true, false, undefined]), last_ouillage: unJour(), last_analyse: unJour() };
    const cont = rnd();
    // Un lot de fûts = {annee, nb} (cave.js, _cuvTonneaux), toujours écrit complet. ⚠️ On ne l'abîme pas :
    //   un lot sans année ou nul n'a pas de chemin d'écriture, et durcir chaque lecteur contre lui
    //   serait du code pour un cas qui n'existe pas (tirage essayé et retiré le 28/09).
    if (cont < .55) c.tonneaux = [{ annee: pick([2022, 2024, 2025]), nb: pick([1, 4, 6]) }].concat(rnd() < .3 ? [{ annee: 2023, nb: 2 }] : []);
    else if (cont < .8) c.nb_tonneaux = pick([0, 3, 6, 12]);
    else if (cont < .9) c.tonneaux = [];
    if (c.fml_terminee) c.fml_terminee_date = unJour();
    if (c.statut === 'embouteille') { c.nb_bouteilles = nombre(); c.date_embouteillage = unJour(); if (rnd() < .3) c.bilan_perte = nombre(); }
    if (rnd() < .2) c.couleur = pick(['rouge', 'blanc', 'rose', null]);
    if (rnd() < .2) c.appellation = pick(['Gevrey-Chambertin', null]);
    if (rnd() < .15) c.futs = pick([[{ id: 'f1' }], [], null, 'x']);
    cuvees.push(c);
  }
  if (rnd() < .06) cuvees.push(pick([null, 'x', []]));
  const ids = cuvees.filter(c => c && c.id).map(c => c.id);
  const DATAS = { ouillage: () => pick([{ nb_ouillettes: 6, vol_ouillette_L: 1, vol_total_L: 6 }, { vol_total_L: '6' }, {}, null]),
    soufre: () => pick([{ grammes_pastille: 5, mode: 'pastille', nb_input: 2, nb_total: 4, so2_total_g: 20 }, { so2_total_g: null }, {}]),
    soutirage: () => pick([{ note: 'propre' }, {}, null]),
    analyse: () => pick([{ so2_libre: 25, so2_total: 60, av: 0.4, ph: 3.6, tav: 13 }, { so2_libre: '25', av: null }, {}]) };
  const operations = [];
  for (let i = 0; i < Math.floor(rnd() * 15); i++) {
    const type = pick(['ouillage', 'soufre', 'soutirage', 'analyse', 'prelevement', 'inconnu', undefined]);
    operations.push({ id: 'o' + i, type, date: unJour(), cuvee_id: pick(ids.concat(['absente', undefined])), cuvees_ids: pick([ids.slice(0, 2), [], null, undefined]),
      operateur: pick(['Nico', '', undefined]), intervenants: pick([[], ['Victor'], null]), notes: pick(['', 'RAS', undefined]), data: (DATAS[type] || (() => pick([{}, null])))() });
  }
  const analyses = rnd() < .4 ? [{ id: 'la1', cuvee_ids: ids.slice(0, 1), commentaire: 'labo', nom_fichier: 'bulletin.pdf', taille: 12000, url: 'https://x/y.pdf', uploaded_at: '2026-06-01T10:00:00Z' }, pick([{}, { cuvee_ids: null }])] : [];
  const ce = pick([{ cuvees, operations, analyses, config: pick([{ ouillage_alerte_j: 14 }, { ouillage_alerte_j: '10' }, {}, null]) }, { cuvees, operations }, { cuvees: null, operations: null }]);
  const recoltes = [];
  for (let i = 0; i < Math.floor(rnd() * 10); i++) {
    const parts = [];
    for (let k = 0; k < 1 + Math.floor(rnd() * 3); k++) {
      const p = { dom: rnd() < .6, caisses: nombre(), pck: pick([25, 22, '25', null, undefined]) };
      if (!p.dom) { p.client = pick(['Négoce Martin', '', undefined]); if (rnd() < .5) p.retour = pick([{ jus: 12.5, lie: 0.8, le: unJour(), src: 'saisie' }, { jus: '12', lie: null }, { jus: 10, lie: 1, le: unJour(), src: 'groupe', grp: 'g1' }, {}]); }
      if (rnd() < .3) p.surface = nombre();
      parts.push(p);
    }
    recoltes.push({ id: 'r' + i, parcelle: pick(P.concat(['Saisie libre', '', undefined])), date: unJour(), parts: rnd() < .1 ? pick([null, [], 'x']) : parts, nb_caisses: nombre(),
      temp_c: nombre(), etat_pct: nombre(), erasflage: pick(['total', 'partiel', undefined]), vendu: rnd() < .2, client: pick(['', 'Négoce', undefined]),
      cuvee: pick(cuvees.filter(c => c && c.nom).map(c => c.nom).concat(['', undefined])), vcuvee_id: pick(ids.concat([null])), note: '', cuve_id: pick(['k0', 'k1', 'absente', null]) });
  }
  const cuves_vinif = [];
  for (let i = 0; i < Math.floor(rnd() * 5); i++) cuves_vinif.push({ id: 'k' + i, nom: 'Cuve ' + i, volume_hl: nombre(), statut: pick(['setup', 'mpf', 'ferm', 'fml', 'ecoule', 'decuvee', undefined, 'inconnu']),
    cuve_ref: pick([null, 'ref1']), parcelles: pick([P.slice(0, 2), [], null]), date_entree: unJour(), erasflage: pick(['total', undefined]), so2_g_hl: nombre(), levures: pick(['indigenes', 'selectionnees', undefined]),
    mpf: pick([{ active: true, temp_c: 12, duree_j: 4 }, null, undefined]), mesures: pick([[{ date: unJour(), densite: 1080, temp: 24 }, { date: unJour(), densite: '1010' }], [], null, undefined]),
    vol_decuve_hl: pick([null, 18, '17']), recolte_ids: pick([recoltes.slice(0, 2).map(r => r.id), [], undefined]), fusion: pick([null, { dans: 'k0', le: unJour() }]), fusion_src: pick([undefined, ['k1']]),
    statut_hist: pick([[{ statut: 'ferm', le: unJour() }, { statut: 'fml', le: unJour() }], [], null, undefined]), vcuvee_id: pick(ids.concat([null])) });
  const ana = [];
  for (let i = 0; i < Math.floor(rnd() * 9); i++) ana.push({ id: 'va' + i, parcelle: pick(P.concat(['Inconnue'])), date: unJour(), mode: pick(['sucre', 'sucre', 'alc', undefined]), val: pick([176, 205, 12.4, 0, null]), spd: pick([16.83, 17, null, undefined]) });
  const cv = pick([{ recoltes, cuves_vinif, analyses: ana, config: pick([{ poids_caisse_kg: 25, ratio_min: 130, ratio_max: 140 }, { poids_caisse_kg: '22' }, {}]) },
    { recoltes, cuves_vinif }, { recoltes: null, cuves_vinif: null, analyses: null }, {}]);
  const intrants = pick([{}, { futs: [{ id: 'f1', annee: 2024, prix: pick([900, '850', null]), statut: pick(['plein', 'vide', undefined]), cuvee_id: pick(ids.concat([null])) }] }, { futs: null }]);
  const config = { domaine_nom: 'Domaine test', eco: pick([undefined, { kg_bouteille: 1.3 }, { kg_bouteille: 'x' }]) };
  return { parcelles, ce, cv, intrants, config };
}
const ECHECS = new Map();
const note = (quoi, s, msg) => { if (!ECHECS.has(msg)) ECHECS.set(msg, { s, quoi, vues: new Set() }); ECHECS.get(msg).vues.add(quoi); };
let appels = 0;
for (let s = 1; s <= N; s++) {
  graine = s;
  const d = domaine();
  poser(cles(d));
  A.setAuj(pick([[2026, 8, 27], [2026, 9, 12], [2026, 2, 1], [2027, 0, 5]]));
  for (const [v, g] of VUES) { appels++; jouer(v, g, (q, m) => note(q, s, m)); }
  for (const c of ((G.CAVE_ELEVAGE || {}).cuvees || [])) if (c && c.id) { appels++; jouer('fiche cuvée', () => G.openCuveeDetail(c.id), (q, m) => note(q, s, m)); }
}
T('B1 · ' + appels + ' rendus : aucun plantage, aucune erreur journalisée ou avalée, rien de sale à l\u2019écran', ECHECS.size === 0,
  [...ECHECS].slice(0, 15).map(([k, v]) => '\n        graine ' + v.s + ', ' + v.quoi + (v.vues.size > 1 ? ' (+' + (v.vues.size - 1) + ' vues)' : '') + ' — ' + k).join(''));

// ═══ C. LISTES-1 DANS LES DOCUMENTS DE LA CAVE ══════════════════════════════
console.log('\nC. LISTES-1 — les listes du Chai et du Cuvier ne portent que des fiches');
{
  const traces = [];
  const avant = G.logError; G.logError = o => { traces.push(o); };
  try {
    G.applyFbData('cave_elevage', { cuvees: [{ id: 'c1', nom: 'Gevrey VV', millesime: 2025, tonneaux: [{ annee: 2024, nb: 6 }], statut: 'elevage' }, null, 'x'], operations: null, analyses: 'texte', config: { ouillage_alerte_j: 14 } });
    G.applyFbData('cave_vendange', { recoltes: [null, { id: 'r1', parcelle: 'Clos Bas', date: '2026-09-15', parts: [] }], cuves_vinif: [] });
  } finally { G.logError = avant; }
  const CE = G.CAVE_ELEVAGE || {}, CV = G.CAVE_VENDANGE || {};
  T('C1 · les cuvées nulles ou en texte sont écartées, la vraie gardée', Array.isArray(CE.cuvees) && CE.cuvees.length === 1 && CE.cuvees[0].id === 'c1', JSON.stringify(CE.cuvees));
  T('C2 · une sous-liste nulle ou en texte redevient la liste vide par défaut', Array.isArray(CE.operations) && CE.operations.length === 0 && Array.isArray(CE.analyses) && CE.analyses.length === 0);
  T('C3 · les récoltes nulles sont écartées', Array.isArray(CV.recoltes) && CV.recoltes.length === 1 && CV.recoltes[0].id === 'r1');
  const L1 = traces.filter(o => /LISTES-1/.test(o.msg || ''));
  T('C4 · une trace par sous-liste touchée (cuvees, operations, analyses, recoltes), aucune pour cuves_vinif', L1.length === 4 && !L1.some(o => /cuves_vinif/.test(o.msg)), JSON.stringify(L1.map(o => o.msg)));
  let e = null; try { viderEcran(); G.selectCaveSection('elevage'); G.switchCaveOng('cuv'); } catch (x) { e = x; }
  T('C5 · après ce chargement, le Chai se rend et montre la cuvée', !e && /Gevrey VV/.test(ecran()), e && e.message);
}

console.log('\n──────────────────────────────\n  ' + ok + ' vert · ' + ko + ' rouge');
process.exit(ko ? 1 : 0);
