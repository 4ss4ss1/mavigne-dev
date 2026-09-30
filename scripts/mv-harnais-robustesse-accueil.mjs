#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais : AUCUNE DONNEE NE FAIT PLANTER L'ACCUEIL, LA VIGNE NI LE
//  JOURNAL (ROB-2, dernier module : le cœur d'app.js)
// ═══════════════════════════════════════════════════════════════════════════
//  Même patron que le Planning, le Pilotage, la Cave, le Tracteur et la Réserve :
//  des domaines tirés au hasard, sains ET abîmés, rendus sur TOUTES les vues ; rouge
//  au premier plantage, à la première erreur journalisée ou avalée, au premier
//  « undefined / NaN / [object Object] / Infinity » affiché.
//
//  LES VUES : l'Accueil · La Vigne (toutes tâches, puis une tâche simple, une à
//  passages, une à niveaux) · le Journal (tous, un ouvrier, une tâche, une parcelle)
//  · la fiche de chaque parcelle · le panneau des passages et celui des niveaux · le
//  mur · la saisie d'une entrée · l'équipe du jour.
//  LES DONNÉES : parcelles (statut de tâche en texte = forme d'avant, en objet
//  {p1,p2,p3,ov} pour les passages et {n1,n2,n3} pour les niveaux ; surfaces en texte ;
//  arrachées ; exclusions de tâches), journal (équipes, météo, horodatages, statuts
//  inconnus, dates illisibles), saisons (sans dates, à l'envers, aucune active),
//  membres (inactifs, collectifs, sans rôles), réglages (objectifs, fenêtres,
//  ordre de passage), et le Planning qui alimente l'équipe du jour.
//  Chargeur : scripts/mv-app-node.mjs.
//
//  Usage :
//    node scripts/mv-harnais-robustesse-accueil.mjs            # 12 domaines
//    node scripts/mv-harnais-robustesse-accueil.mjs --long     # 100 domaines
//    node scripts/mv-harnais-robustesse-accueil.mjs --contre   # contre-épreuves
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
    ['app.js', 'la fiche d\u2019une parcelle lit une entrée du journal qui n\u2019existe pas',
      'function openDP(nom){\n', 'function openDP(nom){\n  var __j=JOURNAL[JOURNAL.length].date.length;\n'],
    ['app.js', 'le correctif « NaN h » de la fiche parcelle retiré (Entreplantation sans trous)',
      "?(p.plantation_trous*_plantMinTrou()/60):0):((t.hha||0)*(parseFloat(p.surface)||0));", "?(p.plantation_trous*_plantMinTrou()/60):(t.hha*p.surface)):(t.hha*p.surface);"],
    ['app.js', 'le correctif « NaN h » de l\u2019Accueil retiré (tâche en temps réel sans barème)',
      "    const _hha=(t.hha||0);\n", "    const _hha=t.hha;\n"],
    ['app.js', 'une erreur journalisée à chaque rendu de l\u2019Accueil',
      'function renderHome(){\n', "function renderHome(){\n  if(window.logError) window.logError({level:'error',cat:'accueil',msg:'contre-epreuve'});\n"],
    ['app.js', 'un « NaN » dans la liste du Journal',
      'function renderJournalList(){\n', "function renderJournalList(){\n  var __l=document.getElementById('journal-list'); if(__l) __l.textContent+=' '+(0/0);\n"],
  ];
  let ok = 0, ko = 0;
  console.log('\nContre-épreuves — chaque défaut reposé doit rougir');
  for (const [mod, nom, a, b] of DEFAUTS) {
    let s = fs.readFileSync(path.join(RACINE, 'src', mod), 'utf8');
    if (s.split(a).length !== 2) { ko++; console.log('   ROUGE  défaut non posé (ancre introuvable ou multiple) : ' + nom); continue; }
    s = s.replace(a, b);
    const f = path.join(os.tmpdir(), 'mv-robacc-' + process.pid + '-' + ok + ko + '.js');
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
const { G, els, JOURNAL_ERR, sale, poser, ecran, viderEcran } = A;
G.currentUser = { nom: 'Nico', roles: ['admin', 'ouvrier'] };
// La liste de tâches par défaut (app.js), prise AU CHARGEMENT, avant qu'un tirage la remplace.
const TACHES_DEF = JSON.parse(JSON.stringify(G.TACHES || []));
// Les tâches du catalogue qu'un domaine ACTIVE (Réglages) : « en temps réel », sans barème à l'hectare.
// ★ Le 29/09, en activer une affichait « NaN h » au total de l'Accueil (calcHeures) — ce tirage l'a vu.
const TACHES_TEMPS_REEL = [{ nom: 'Arrachage', anytime: true, tempsReel: true, complementaire: true },
  { nom: 'Desherbage', anytime: true, tempsReel: true, complementaire: true }, { nom: 'Effeuillage', anytime: true, tempsReel: true, complementaire: true },
  { nom: 'Vendange', anytime: true, tempsReel: true, complementaire: true }];

let ok = 0, ko = 0;
const T = (nom, c, d) => { if (c) ok++; else { ko++; console.log('   ROUGE  ' + nom + (d ? '  → ' + d : '')); } };
// renderHome / renderParcelles / renderJournalList ne sont exposés qu'au démarrage de session (après connexion) :
// on passe par goTo / switchVigneOng, le chemin des boutons.
const EXPOSE = ['goTo', 'switchVigneOng', 'setPTacheFilter', 'setJQui', 'setJTache', 'setJParcelle',
  'openDP', 'openPassagesPanel', 'openNiveauxPanel', 'openMur', 'openJournalEntry'];
for (const n of EXPOSE) T('app.js expose ' + n, typeof G[n] === 'function');
const el = () => document.createElement('div');

const VUES = [
  ['Accueil', () => G.switchVigneOng('home')],
  ['Vigne › toutes', () => { G.switchVigneOng('parcelles'); G.setPTacheFilter('toutes', null); }],
  ['Vigne › Taille', () => { G.switchVigneOng('parcelles'); G.setPTacheFilter('Taille', null); }],
  ['Vigne › Ebourgeonnage (passages)', () => { G.switchVigneOng('parcelles'); G.setPTacheFilter('Ebourgeonnage', null); }],
  ['Vigne › Relevage (niveaux)', () => { G.switchVigneOng('parcelles'); G.setPTacheFilter('Relevage', null); }],
  ['Journal › tous', () => { G.switchVigneOng('journal'); G.setJQui('tous', el()); }],
  ['Journal › un ouvrier', () => { G.switchVigneOng('journal'); G.setJQui('Victor', el()); }],
  ['Journal › une tâche', () => { G.switchVigneOng('journal'); G.setJTache('Taille', el()); G.setJTache('toutes', el()); }],
  ['Journal › une parcelle', () => { G.switchVigneOng('journal'); const p = (G.PARCELLES || []).find(x => x && x.nom); G.setJParcelle(p ? p.nom : 'toutes'); G.setJParcelle('toutes'); }],
  ['le mur', () => G.openMur()],
  ['saisie d\u2019une entrée', () => { G.switchVigneOng('journal'); G.openJournalEntry(); }],
  ['l\u2019équipe du jour', () => { if (typeof G.openPTeamJour === 'function') G.openPTeamJour(); }],
];
function jouer(lib, geste, echec) {
  viderEcran();
  const j0 = JOURNAL_ERR.length;
  try { geste(); for (const x of sale(ecran())) echec(lib, x); }
  catch (e) { echec(lib, e.message + ' @ ' + String((e.stack || '').split('\n')[1] || '').trim().replace(/.*\//, '')); }
  for (const o of JOURNAL_ERR.slice(j0)) echec(lib, 'erreur journalisée : ' + String(o.msg || o.cat || '').slice(0, 140));
}
function toutJouer(echec) {
  for (const [v, g] of VUES) jouer(v, g, echec);
  const P = (G.PARCELLES || []).filter(p => p && p.nom).slice(0, 6);
  for (const p of P) {
    jouer('fiche parcelle', () => G.openDP(p.nom), echec);
    jouer('panneau passages', () => G.openPassagesPanel(p.nom, 'Ebourgeonnage'), echec);
    jouer('panneau niveaux', () => G.openNiveauxPanel(p.nom, 'Relevage'), echec);
  }
}
function modele(an) {
  const t = { _timings: {} };
  for (let m = 0; m < 12; m++) { t[m] = {}; t._timings[m] = { d: '07:30', f: '16:00' }; const nd = new Date(an, m + 1, 0).getDate();
    for (let d = 1; d <= nd; d++) { const w = new Date(an, m, d).getDay(); t[m][d] = (w >= 1 && w <= 5) ? 7 : 0; } }
  return t;
}
function cles(d) {
  return { membres: d.membres || [{ nom: 'Nico', statut: 'Actif', roles: ['admin', 'ouvrier'], couleur: '#8A5A38' }], parcelles: d.parcelles || [],
    saisons: d.saisons || [{ nom: 'Printemps 2026', active: true, debut: '2026-03-16', fin: '2026-10-31', taches: ['Ebourgeonnage', 'Relevage', 'Palissage'] }],
    taches: d.taches || TACHES_DEF, config: d.config || {}, journal: d.journal || [], planning_templates: { 2026: { standard: modele(2026) } }, planning_entries: d.pe || {} };
}

// ═══ A. BASE VIDE, BASE FIXE ════════════════════════════════════════════════
console.log('\nA. Chaque vue sur une base vide, puis sur une base fixe');
const FIXE = {
  membres: [{ nom: 'Nico', statut: 'Actif', roles: ['admin', 'ouvrier'], couleur: '#8A5A38', planning_id: 'standard', type_contrat: 'CDI' },
    { nom: 'Victor', statut: 'Actif', roles: ['ouvrier'], couleur: '#3A6B8C', planning_id: 'standard', type_contrat: 'CDI' }],
  parcelles: [{ nom: 'Les Grandes Vignes', surface: 0.42, lat: 47.22, lng: 4.97, statut: 'Actif', cepage: 'Pinot noir', taches: { Taille: 'Validé', Ebourgeonnage: { p1: 'Validé', p2: 'En cours', ov: false }, Relevage: { n1: 'Validé', n2: 'Non démarré' } } },
    { nom: 'Clos Bas', surface: 1.1, lat: 47.21, lng: 4.96, statut: 'Actif', cepage: 'Pinot noir', taches: { Taille: 'En cours', Palissage: 'Non démarré' } }],
  journal: [{ id: 'j1', date: '2026-09-20', parcelle: 'Clos Bas', tache: 'Palissage', qui: 'Victor', statut: 'En cours', equipe: false, membresEquipe: [] },
    { id: 'j2', date: '2026-09-21', parcelle: 'Les Grandes Vignes', tache: 'Ebourgeonnage', qui: 'Nico', statut: 'Validé', equipe: true, membresEquipe: ['Nico', 'Victor'] }],
};
for (const [lib, d] of [['vide', {}], ['fixe', FIXE]]) {
  poser(cles(d));
  const E = [];
  toutJouer((q, m) => E.push(q + ' — ' + m));
  T('A · base ' + lib + ' : toutes les vues sans plantage ni valeur sale', E.length === 0, E.slice(0, 8).join(' | '));
  if (lib === 'fixe') {
    viderEcran(); G.switchVigneOng('journal'); G.setJQui('tous', el());
    T('A · base fixe : le Journal montre les entrées', /Palissage/.test(ecran()) && /Clos Bas/.test(ecran()));
    viderEcran(); G.switchVigneOng('parcelles'); G.setPTacheFilter('toutes', null);
    T('A · base fixe : la Vigne montre les parcelles', /Les Grandes Vignes/.test(ecran()));
    viderEcran(); G.openDP('Clos Bas');
    T('A · base fixe : la fiche d\u2019une parcelle montre son cépage', /Pinot noir/.test(ecran()));
    // Une tâche « en temps réel » activée (Arrachage) : l'Accueil garde un total chiffré.
    poser({ taches: TACHES_DEF.concat([TACHES_TEMPS_REEL[0]]) });
    viderEcran(); G.switchVigneOng('home');
    T('A · base fixe + Arrachage activé : l\u2019Accueil garde un total d\u2019heures chiffré', !/NaN/.test(ecran()) && /class="mv-n">\d/.test(ecran()));
  }
}

// ═══ B. DES DOMAINES TIRÉS AU HASARD ════════════════════════════════════════
console.log('\nB. ' + N + ' domaines tirés au hasard × ' + VUES.length + ' vues + fiche, passages et niveaux de chaque parcelle');
let graine = 1; const rnd = () => { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine / 0x7fffffff; };
const pick = a => a[Math.floor(rnd() * a.length)];
const iso = (y, m, d) => y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
const vraiJour = () => iso(pick([2025, 2026, 2026]), Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28));
const unJour = () => rnd() < .04 ? pick([undefined, '']) : vraiJour();
const ST = ['Validé', 'En cours', 'Non démarré', 'Non démarré'];
function domaine() {
  const noms = ['Nico', 'Victor', 'Alicia', "Jean d'Arc"].slice(0, 2 + Math.floor(rnd() * 3));
  const membres = noms.map(nom => ({ nom, statut: rnd() < .15 ? 'Inactif' : 'Actif', roles: pick([['ouvrier'], ['admin', 'ouvrier'], ['tractoriste'], []]),
    couleur: pick(['#8A5A38', '#3A6B8C', undefined]), planning_id: 'standard', type_contrat: pick(['CDI', 'CDD', 'Saisonnier', undefined]) }));
  if (rnd() < .2) membres.push({ nom: 'Équipe V', statut: 'Actif', roles: ['ouvrier'], collectif: true, effectif: pick([12, 30]), planning_id: 'standard' });
  if (!membres.some(m => m.nom === 'Nico')) membres.unshift({ nom: 'Nico', statut: 'Actif', roles: ['admin', 'ouvrier'] });
  const parcelles = [];
  for (let i = 0; i < 1 + Math.floor(rnd() * 8); i++) {
    const p = { nom: pick(['Les Grandes Vignes', 'Clos Bas', 'En Champs', "L'Étang", 'La Justice']) + ' ' + i, surface: pick([0.42, 1.1, 0.8, 2.35, 0]),   // toujours un nombre : les deux créateurs font parseFloat
      lat: 47.2 + rnd() / 50, lng: 4.9 + rnd() / 50, statut: pick(['Actif', 'Actif', 'Actif', 'Arrachee']), cepage: pick(['Pinot noir', 'Chardonnay', '', undefined]), taches: {} };
    for (const t of ['Taille', 'Tirage', 'Reparation', 'Pliage', 'Accolage', 'Palissage']) if (rnd() < .6) p.taches[t] = pick(ST);
    if (rnd() < .6) p.taches.Ebourgeonnage = pick([{ p1: pick(ST), p2: pick(ST), ov: rnd() < .2 }, { p1: 'Validé' }, {}, 'Validé']);   // texte = forme d'avant
    if (rnd() < .5) p.taches.Relevage = pick([{ n1: pick(ST), n2: pick(ST), n3: pick(ST) }, { n1: 'Validé' }, {}, 'En cours']);
    if (rnd() < .2) p.tachesExclues = pick([['Taille'], []]);
    if (rnd() < .1) p.taches = pick([undefined, {}]);
    if (rnd() < .2) p.appellation = pick(['Gevrey-Chambertin', 'Bourgogne']);
    parcelles.push(p);
  }
  const P = parcelles.map(p => p.nom);
  const saisons = [{ nom: 'Hiver 2025-2026', active: false, debut: '2025-11-01', fin: '2026-03-15', taches: ['Taille', 'Tirage', 'Brulage'] },
    { nom: 'Printemps 2026', active: true, debut: '2026-03-16', fin: '2026-07-31', taches: pick([['Ebourgeonnage', 'Relevage', 'Palissage', 'Pliage'], undefined, []]) }];
  if (rnd() < .3) saisons.push({ nom: 'Vendanges 2026', active: false, debut: '2026-08-01', fin: '2026-10-31' });
  if (rnd() < .15) saisons.push(pick([{ nom: 'Sans dates' }, { nom: 'À l\u2019envers', debut: '2026-10-01', fin: '2026-09-01' }]));
  if (rnd() < .1) saisons.forEach(s => { s.active = false; });
  const journal = [];
  for (let i = 0; i < Math.floor(rnd() * 40); i++) {
    const e = { id: 'j' + i, date: vraiJour(),   // une entrée porte toujours une date (le jour, ou celui choisi)
      parcelle: pick(P.concat(['Domaine', 'Parcelle supprimée'])), tache: pick(['Taille', 'Palissage', 'Ebourgeonnage', 'Relevage', 'Réparation ponctuelle', 'Tâche supprimée']),
      qui: pick(noms.concat(['Ancien salarié'])), statut: pick(['Validé', 'En cours', 'Info', 'Annulé', 'inconnu']), equipe: rnd() < .25 };
    e.membresEquipe = e.equipe ? pick([noms.slice(0, 2), [], ['Ancien salarié']]) : [];
    if (rnd() < .3) { e.ts_debut = new Date(2026, 8, 1, 7).getTime(); e.ts_fin = e.ts_debut + pick([36e5, 72e5, 0]); }
    if (rnd() < .15) { e.passage = pick([1, 2, '2']); }
    if (rnd() < .1) { e.niveau = pick([1, 2, 3]); }
    if (rnd() < .2) e.note = pick(['RAS', '', 'Pluie à 10 h']);
    // Météo : la forme exacte des trois écrivains d'app.js (temp, desc, wind, emoji).
    if (rnd() < .05) { e.tache = 'Météo'; e.qui = 'Auto'; e.statut = 'Info'; e.meteo = true; e.temp = pick([18, 7.5, -2]); e.desc = 'Nuageux'; e.wind = pick([12, 30]); e.emoji = '\u2601\ufe0f'; }
    journal.push(e);
  }
  const config = {
    objectifs_fin: pick([undefined, {}, { Taille: '2026-03-31', Palissage: '2026-07-15' }]),
    task_windows: pick([undefined, {}, { Palissage: { debut: '2026-05-15', fin: '2026-07-15' } }]),
    ordre_passage_t: pick([undefined, {}, { Taille: P.slice(0, 2).concat(['Parcelle supprimée']) }]),
    saison_passages: pick([undefined, { Ebourgeonnage: 2, Relevage: 3 }]),
  };
  const pe = {};
  for (const m of membres) { const y = {}; for (let mo = 0; mo < 12; mo++) { y[mo] = {}; for (let d = 1; d <= 28; d++) if (rnd() < .1) y[mo][d] = pick([{ type: 'cp', heures: 7 }, { type: 'recup' }, { absent: true, motif: 'arret', comment: '' }, { timing: { debut: '07:00', fin: '17:00' }, comment: '' }]); } pe[m.nom] = { 2026: y }; }
  const taches = TACHES_DEF.concat(TACHES_TEMPS_REEL.filter(() => rnd() < .4));
  return { membres, parcelles, saisons, journal, config, pe, taches };
}
const ECHECS = new Map();
const note = (quoi, s, msg) => { if (!ECHECS.has(msg)) ECHECS.set(msg, { s, quoi, vues: new Set() }); ECHECS.get(msg).vues.add(quoi); };
for (let s = 1; s <= N; s++) {
  graine = s;
  poser(cles(domaine()));
  A.setAuj(pick([[2026, 8, 27], [2026, 0, 3], [2026, 5, 15], [2026, 11, 31]]));
  toutJouer((q, m) => note(q, s, m));
}
T('B1 · ' + N + ' domaines : aucun plantage, aucune erreur journalisée ou avalée, rien de sale à l\u2019écran', ECHECS.size === 0,
  [...ECHECS].slice(0, 15).map(([k, v]) => '\n        graine ' + v.s + ', ' + v.quoi + (v.vues.size > 1 ? ' (+' + (v.vues.size - 1) + ' vues)' : '') + ' — ' + k).join(''));

console.log('\n──────────────────────────────\n  ' + ok + ' vert · ' + ko + ' rouge');
process.exit(ko ? 1 : 0);
