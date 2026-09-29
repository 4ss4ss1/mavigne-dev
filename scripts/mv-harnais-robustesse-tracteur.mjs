#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais : AUCUNE DONNEE NE FAIT PLANTER LE TRACTEUR (ROB-2)
// ═══════════════════════════════════════════════════════════════════════════
//  Même patron que le Planning, le Pilotage et la Cave : des domaines tirés au
//  hasard, sains ET abîmés, rendus sur TOUTES les vues ; rouge au premier plantage,
//  à la première erreur journalisée ou avalée, au premier « undefined / NaN /
//  [object Object] / Infinity » affiché.
//
//  LES VUES : Sessions · Entretien (bandeau réparateur, fiches, cuve GNR) · réglages
//  du parc · liste des fiches · le détail et la modification de chaque session ·
//  la fiche de chaque tracteur — pour CHAQUE tracteur sélectionné.
//  LES DONNÉES : sessions (parcelles faites en texte = forme d'avant, en objet
//  {nom, data} = forme du jour ; chronomètre `trace` ; traitements), tracteurs
//  (compteur et révision vides / en texte), fiches d'entretien, immobilisations en
//  cours (REPARATEUR) et archivées (REPARATEUR_HIST : un OBJET par tracteur),
//  cuve GNR, conducteurs, activités.
//  Chargeur : scripts/mv-app-node.mjs.
//
//  Usage :
//    node scripts/mv-harnais-robustesse-tracteur.mjs            # 12 domaines
//    node scripts/mv-harnais-robustesse-tracteur.mjs --long     # 100 domaines
//    node scripts/mv-harnais-robustesse-tracteur.mjs --contre   # contre-épreuves
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
    ['tracteur.js', 'le détail d\u2019une session lit la première parcelle faite sans garde',
      'function openSessionDetail(id){\n', 'function openSessionDetail(id){\n  var __s=(SESSIONS||[]).find(function(x){return x&&x.id===id;}); var __n=__s.parcellesFaites[0].nom;\n'],
    ['tracteur.js', 'un « NaN » dans les réglages du parc',
      'function renderTracteurSet(){\n', "function renderTracteurSet(){\n  var __b=document.getElementById('trac-set-list'); if(__b) __b.textContent+=' '+(0/0);\n"],
    ['tracteur.js', 'le correctif « undefined% d\u2019avancement » retiré',
      "+(Number(dataEnc[0].avancement)||0)+", "+dataEnc[0].avancement+"],
    ['tracteur.js', 'le correctif « data-defid=undefined » retiré (activité sans tracteur par défaut)',
      "data-defid=\"'+(defId||'')+'\"'", "data-defid=\"'+defId+'\"'"],
    ['tracteur.js', 'une erreur journalisée à chaque rendu',
      'function renderTracteur(){\n', "function renderTracteur(){\n  if(window.logError) window.logError({level:'error',cat:'tracteur',msg:'contre-epreuve'});\n"],
  ];
  let ok = 0, ko = 0;
  console.log('\nContre-épreuves — chaque défaut reposé doit rougir');
  for (const [mod, nom, a, b] of DEFAUTS) {
    let s = fs.readFileSync(path.join(RACINE, 'src', mod), 'utf8');
    if (s.split(a).length !== 2) { ko++; console.log('   ROUGE  défaut non posé (ancre introuvable ou multiple) : ' + nom); continue; }
    s = s.replace(a, b);
    const f = path.join(os.tmpdir(), 'mv-robtrac-' + process.pid + '-' + ok + ko + '.js');
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
G.currentUser = { nom: 'Victor', roles: ['admin', 'tractoriste'] };
G.isTractoriste = () => true;

let ok = 0, ko = 0;
const T = (nom, c, d) => { if (c) ok++; else { ko++; console.log('   ROUGE  ' + nom + (d ? '  → ' + d : '')); } };
for (const n of ['renderTracteur', 'switchTracOnglet', 'selectTracteur', 'openSessionDetail', 'openEditSession', 'renderTracteurSet', 'openListeFiches', 'openEditTracteur'])
  T('le Tracteur expose ' + n, typeof G[n] === 'function');

const VUES = [
  ['Sessions', () => { G.switchTracOnglet('sessions'); G.renderTracteur(); }],
  ['Entretien', () => { G.switchTracOnglet('entretiens'); G.renderTracteur(); }],
  ['Réglages du parc', () => G.renderTracteurSet()],
  ['Liste des fiches', () => G.openListeFiches()],
];
function jouer(lib, geste, echec) {
  viderEcran();
  const j0 = JOURNAL_ERR.length;
  try { geste(); for (const x of sale(ecran())) echec(lib, x); }
  catch (e) { echec(lib, e.message + ' @ ' + String((e.stack || '').split('\n')[1] || '').trim().replace(/.*\//, '')); }
  for (const o of JOURNAL_ERR.slice(j0)) echec(lib, 'erreur journalisée : ' + String(o.msg || o.cat || '').slice(0, 140));
}
function toutJouer(echec) {
  const tracs = (G.TRACTEURS_LIST || []).filter(t => t && t.id);
  for (const t of (tracs.length ? tracs : [null])) {
    if (t) G.selectTracteur(t.id);
    const q = t ? ' [' + t.id + ']' : '';
    for (const [v, g] of VUES) jouer(v + q, g, echec);
    if (t) jouer('fiche tracteur' + q, () => G.openEditTracteur(t.id), echec);
  }
  for (const s of (G.SESSIONS || [])) if (s && s.id) {
    jouer('détail session', () => G.openSessionDetail(s.id), echec);
    jouer('modifier session', () => G.openEditSession(s.id), echec);
  }
}
function cles(d) {
  return { membres: d.membres || [{ nom: 'Victor', statut: 'Actif', roles: ['admin', 'tractoriste'] }], parcelles: d.parcelles || [],
    saisons: d.saisons || [{ nom: 'Printemps 2026', active: true, debut: '2026-03-16', fin: '2026-10-31' }], config: d.config || {},
    sessions: d.sessions || [], tracteurs_list: d.tracteurs || [], entretiens: d.entretiens || [], reparateur: d.rep || {},
    reparateur_hist: d.repHist || {}, conducteurs: d.conducteurs || [{ nom: 'Victor', statut: 'Actif' }], activites: d.activites || [{ nom: 'Rognage' }] };
}

// ═══ A. BASE VIDE, BASE FIXE ════════════════════════════════════════════════
console.log('\nA. Chaque vue sur une base vide, puis sur une base fixe');
const FIXE = {
  parcelles: [{ nom: 'Les Grandes Vignes', surface: 0.42, statut: 'Actif', taches: {} }, { nom: 'Clos Bas', surface: 1.1, statut: 'Actif', taches: {} }],
  tracteurs: [{ id: 'tr1', nom: 'Enjambeur Bobard', type: 'Enjambeur', compteur_h: 1200, revision_h: 1250 }, { id: 'tr2', nom: 'Fendt 208', type: 'Tracteur', compteur_h: '', revision_h: '' }],
  sessions: [{ id: 's1', saison: 'Printemps 2026', activite: 'Rognage', date: '2026-09-21', conducteur: 'Victor', statut: 'En cours', avancement: 50, parcellesFaites: ['Clos Bas'], tracteurId: 'tr1', note: '' },
    { id: 's2', saison: 'Printemps 2026', activite: 'Rognage', date: '2026-09-10', dateFin: '2026-09-11', conducteur: 'Victor', statut: 'Terminé', avancement: 100, parcellesFaites: [{ nom: 'Les Grandes Vignes', data: {} }, { nom: 'Clos Bas', data: {} }], tracteurId: 'tr2' }],
  entretiens: [{ id: 'e1', tracteurId: 'tr1', date: '2026-09-20', conducteur: 'Victor', anomalie: '', anomalie_traitee: false, plein: true, huile: true, litres_plein: 80 }],
  rep: { tr2: { depuis: '2026-09-18', motif: 'embrayage', prevu_retour: '2026-09-30', four: 'Garage Martin' } },
  repHist: { tr1: [{ depuis: '2026-05-02', retour: '2026-05-06', motif: 'pneu', four: 'Garage', eur: 320 }] },
  activites: [{ nom: 'Rognage', tracteurDefautId: 'tr1' }],
  config: { gnr: { capacite: 1000, niveau: 600, seuil: 200, maj: '2026-09-01' } },
};
for (const [lib, d] of [['vide', {}], ['fixe', FIXE]]) {
  poser(cles(d));
  const E = [];
  toutJouer((q, m) => E.push(q + ' — ' + m));
  T('A · base ' + lib + ' : toutes les vues sans plantage ni valeur sale', E.length === 0, E.slice(0, 8).join(' | '));
  if (lib === 'fixe') {
    viderEcran(); G.selectTracteur('tr1'); G.switchTracOnglet('sessions'); G.renderTracteur();
    T('A · base fixe : les sessions montrent l\u2019activité', /Rognage/.test(ecran()));
    viderEcran(); G.switchTracOnglet('entretiens'); G.renderTracteur();
    T('A · base fixe : l\u2019entretien montre le parc', /Enjambeur Bobard/.test(ecran()));
    // s1 : Clos Bas est faite, Les Grandes Vignes reste — le détail liste ce qui RESTE à faire.
    viderEcran(); G.openSessionDetail('s1');
    T('A · base fixe : le détail d\u2019une session montre la parcelle qui reste', /Les Grandes Vignes/.test(ecran()));
  }
}

// ═══ B. DES DOMAINES TIRÉS AU HASARD ════════════════════════════════════════
console.log('\nB. ' + N + ' domaines tirés au hasard × chaque tracteur × chaque vue + chaque session');
let graine = 1; const rnd = () => { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine / 0x7fffffff; };
const pick = a => a[Math.floor(rnd() * a.length)];
const iso = (y, m, d) => y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
const vraiJour = () => iso(pick([2025, 2026, 2026]), Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28));
const unJour = () => rnd() < .04 ? pick([undefined, '']) : vraiJour();
// ⚠️ Là où le formulaire EXIGE la date (départ chez le réparateur : « Date et motif requis » ; retour = le jour
//    même), on ne tire que des dates valides — une immobilisation sans date de départ n'a pas de chemin
//    d'écriture. Idem pour l'instant `t` d'un pointage du chronomètre, posé par Date.now().
function domaine() {
  const parcelles = [];
  for (let i = 0; i < 1 + Math.floor(rnd() * 7); i++) parcelles.push({ nom: pick(['Les Grandes Vignes', 'Clos Bas', 'En Champs', "L'Étang"]) + ' ' + i, surface: pick([0.4, 1.1, '0,8', null]), statut: pick(['Actif', 'Actif', 'Arrachee']), taches: {} });
  const P = parcelles.map(p => p.nom);
  const tracteurs = [];
  for (let i = 0; i < Math.floor(rnd() * 4); i++) tracteurs.push({ id: 'tr' + i, nom: pick(['Enjambeur', 'Fendt 208', 'Chenillard', '']) + ' ' + i, type: pick(['Enjambeur', 'Tracteur', 'Chenillard', undefined]),
    compteur_h: pick([1200, 0, '', '1350', null, undefined]), revision_h: pick([1250, '', null, undefined, 900]), traitementOnly: rnd() < .2 });
  const T0 = tracteurs.map(t => t.id);
  const noms = ['Victor', 'Nico', "Jean d'Arc"];
  const ACTS = ['Rognage', 'Labour', 'Traitement', 'Tonte'];
  const sessions = [];
  for (let i = 0; i < Math.floor(rnd() * 10); i++) {
    const faites = [];
    for (const p of P) if (rnd() < .4) faites.push(pick([p, { nom: p, data: {} }, { nom: p, data: { Hauteur: '1,20 m' } }, { nom: p, t0: Date.now() - 36e5, t1: Date.now() }]));
    const s = { id: 's' + i, saison: pick(['Printemps 2026', 'Hiver 2025-2026', undefined]), activite: pick(ACTS.concat([undefined, 'Supprimée'])), date: unJour(),
      conducteur: pick(noms.concat(['', undefined])), statut: pick(['En cours', 'En cours', 'Terminé', 'Validé', undefined]), avancement: pick([0, 40, 100, '50', null, undefined]),
      parcellesFaites: rnd() < .06 ? pick([null, undefined]) : faites, tracteurId: pick(T0.concat(['disparu', undefined])), tracteurOverride: rnd() < .1, note: pick(['', 'RAS', undefined]) };
    if (rnd() < .3) s.parcellesSkip = pick([[P[0]], [], null]);
    if (s.statut === 'Terminé' || rnd() < .1) s.dateFin = unJour();
    if (rnd() < .3) s.trace = pick([[{ t: Date.now() - 72e5, e: 'd', p: P[0] }, { t: Date.now() - 36e5, e: 'f', p: P[0] }], [], null]);
    if (rnd() < .2) { s.type = 'traitement'; s.produits = pick([['Cuivre', 'Soufre'], [], null]); s.parcelles = pick([P.slice(0, 2), null]); s.modeAb = pick(['AB', 'conv', undefined]); }
    sessions.push(s);
  }
  const entretiens = [];
  for (let i = 0; i < Math.floor(rnd() * 8); i++) {
    const f = { id: 'e' + i, tracteurId: pick(T0.concat(['disparu'])), date: unJour(), conducteur: pick(noms.concat([''])), anomalie: pick(['', 'fuite hydraulique', undefined]), anomalie_traitee: rnd() < .3 };
    for (const k of ['plein', 'huile', 'filtre_air', 'graissage', 'pression']) if (rnd() < .5) f[k] = rnd() < .7;
    if (f.plein && rnd() < .6) f.litres_plein = pick([80, '60', 0, null]);
    entretiens.push(f);
  }
  const rep = {};
  for (const t of T0) if (rnd() < .2) rep[t] = pick([{ depuis: vraiJour(), motif: 'embrayage', prevu_retour: pick([vraiJour(), '']), four: pick(['Garage', '']) }, { depuis: vraiJour(), motif: 'pneu' }, null]);   // null : ce qu'écrit la suppression d'un tracteur (REPARATEUR[id]=null)
  const repHist = {};
  for (const t of T0) if (rnd() < .3) repHist[t] = pick([[{ depuis: vraiJour(), retour: vraiJour(), motif: 'pneu', four: pick(['Garage', '']), eur: pick([320, '320', 0, undefined]) }], []]);
  const config = { gnr: pick([{ capacite: 1000, niveau: 600, seuil: 200, maj: unJour() }, { capacite: '1500', niveau: '300' }, { capacite: 0 }, null, undefined]), chrono_mode: pick([undefined, 'auto', 'manuel']) };
  const conducteurs = noms.map(n => ({ nom: n, statut: pick(['Actif', 'Actif', 'Inactif']) }));
  const activites = ACTS.map(a => ({ nom: a, tracteurDefautId: pick(T0.concat([undefined])), champCustom: rnd() < .2 ? { label: 'Hauteur' } : undefined }));
  return { parcelles, tracteurs, sessions, entretiens, rep, repHist, config, conducteurs, activites };
}
const ECHECS = new Map();
const note = (quoi, s, msg) => { if (!ECHECS.has(msg)) ECHECS.set(msg, { s, quoi, vues: new Set() }); ECHECS.get(msg).vues.add(quoi); };
let appels = 0;
for (let s = 1; s <= N; s++) {
  graine = s;
  poser(cles(domaine()));
  A.setAuj(pick([[2026, 8, 27], [2026, 0, 3], [2026, 5, 15]]));
  toutJouer((q, m) => { note(q, s, m); });
  appels++;
}
T('B1 · ' + N + ' domaines : aucun plantage, aucune erreur journalisée ou avalée, rien de sale à l\u2019écran', ECHECS.size === 0,
  [...ECHECS].slice(0, 15).map(([k, v]) => '\n        graine ' + v.s + ', ' + v.quoi + (v.vues.size > 1 ? ' (+' + (v.vues.size - 1) + ' vues)' : '') + ' — ' + k).join(''));

console.log('\n──────────────────────────────\n  ' + ok + ' vert · ' + ko + ' rouge');
process.exit(ko ? 1 : 0);
