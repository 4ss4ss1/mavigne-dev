#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
//  MA VIGNE — Harnais : AUCUNE DONNEE NE FAIT PLANTER LE PILOTAGE (ROB-2)
// ═══════════════════════════════════════════════════════════════════════════
//  POURQUOI IL EXISTE.
//  Même patron que mv-harnais-robustesse-planning (§191) : les contrôles du
//  Pilotage jouent des données écrites par le code du jour. Une base réelle porte
//  aussi des données d'AVANT (archives de clôture, réglages mémorisés, fiches
//  incomplètes) et des données abîmées. Le Pilotage relit TOUT le domaine
//  (Planning, journal, sessions, cave, réserve, phyto, paie) : c'est le module
//  qu'une donnée tordue ailleurs fait tomber.
//
//  CE QU'IL FAIT.
//   Il charge l'APPLICATION ENTIÈRE (app.js et ses modules, dans l'ordre réel),
//   sans CSS ni Firebase, dans un DOM minimal où `window` EST l'objet global —
//   comme dans le navigateur, où un nom posé par `window.X =` se lit nu ailleurs.
//   A. Chaque onglet sur une base vide, puis sur une base fixe complète.
//   B. Des domaines tirés AU HASARD (graine fixe : un rouge se rejoue) : fiches,
//      parcelles, journal, sessions, cave, réserve, phyto, paie, archives et
//      réglages mémorisés, sains ET abîmés (champs manquants, nombres en texte,
//      null, formes d'avant). Chaque onglet, chaque sous-vue d'Économie, les
//      deux axes, quatre dates du jour.
//   ROUGE si : une exception, une erreur journalisée (hors « info »), OU un
//   « undefined », « NaN », « [object Object] », « Infinity » affiché.
//
//  Usage :
//    node scripts/mv-harnais-robustesse-pilotage.mjs            # 12 domaines
//    node scripts/mv-harnais-robustesse-pilotage.mjs --long     # 100 domaines
//    node scripts/mv-harnais-robustesse-pilotage.mjs --contre   # contre-épreuves
//  Exit 0 si tout passe, 1 sinon. Un CRASH est ROUGE.
//  Jamais déployé (scripts/) -> aucun bump.  ⚠️ CHEMINS : pathToFileURL (§53).
// ═══════════════════════════════════════════════════════════════════════════
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { chargerApp } from './mv-app-node.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..');
const ARGS = process.argv.slice(2);
const CONTRE = ARGS.includes('--contre');
const N = ARGS.includes('--long') ? 100 : 12;
const APP_CIBLE = process.env.MV_ROB_APP || '';
const CIBLE = process.env.MV_ROB_CIBLE || path.join(RACINE, 'src', 'pilotage.js');

// ── Contre-épreuves : défaut reposé sur une COPIE de pilotage.js, joué dans un
//    processus à part. Chaque défaut doit rougir.
if (CONTRE) {
  const src = fs.readFileSync(CIBLE, 'utf8');
  const DEFAUTS = [
    ['un onglet qui lit un champ d\u2019une archive sans la garder',
      [["function _arcHeures(nom){\n  var h=(window.HISTORIQUE||[]).find(function(x){ return x&&x.saisonNom===nom; });\n  return (h&&h.stats&&h.stats.hFaites)||0;",
        "function _arcHeures(nom){\n  var h=(window.HISTORIQUE||[]).find(function(x){ return x&&x.saisonNom===nom; });\n  return h.stats.hFaites||0;"]]],
    ['un « NaN » dans l\u2019onglet Archives',
      [["+'<div><div class=\"v\">'+S.length+'</div><div class=\"l\">périodes</div></div>'",
        "+'<div><div class=\"v\">'+(S.length/0*0)+'</div><div class=\"l\">périodes</div></div>'"]]],
    ['un tracteur sans compteur affiché en « undefined »',
      [["return { id:t.id, nom:t.nom, traitementOnly:t.traitementOnly,", "return { id:t.id, nom:t.nom+' '+t.compteur_absent, traitementOnly:t.traitementOnly,"]]],
    ['une erreur avalée et journalisée dans le rendu',
      [["function renderPilotage(){\n", "function renderPilotage(){\n  if(window.logError) window.logError({level:'error',cat:'pilotage',msg:'contre-epreuve'});\n"]]],
  ];
  // Défauts d'app.js : même mécanique, sur une copie d'app.js (MV_ROB_APP).
  const srcApp = fs.readFileSync(path.join(RACINE, 'src', 'app.js'), 'utf8');
  const DEFAUTS_APP = [
    ['LISTES-1 retiré : applyFbData laisse passer une parcelle nulle',
      [['  value = _mvListeObjets(key, value);\n', '']]],
  ];
  let ok = 0, ko = 0;
  console.log('\nContre-épreuves — chaque défaut reposé doit rougir');
  for (const [nom, reps] of DEFAUTS_APP) {
    let s = srcApp, pose = true;
    for (const [a, b] of reps) { if (s.split(a).length !== 2) { pose = false; break; } s = s.replace(a, b); }
    if (!pose) { ko++; console.log('   ROUGE  défaut non posé (ancre introuvable ou multiple) : ' + nom); continue; }
    const f = path.join(os.tmpdir(), 'mv-robpil-app-' + process.pid + '-' + ok + ko + '.js');
    fs.writeFileSync(f, s);
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, MV_ROB_APP: f }, encoding: 'utf8', timeout: 240000 });
    fs.unlinkSync(f);
    if (r.status !== 0 && /ROUGE/.test(r.stdout || '')) { ok++; console.log('   vert   rougit : ' + nom); }
    else { ko++; console.log('   ROUGE  RESTE VERT : ' + nom + '\n' + String(r.stdout || '').slice(-600)); }
  }
  for (const [nom, reps] of DEFAUTS) {
    let s = src, pose = true;
    for (const [a, b] of reps) { if (s.split(a).length !== 2) { pose = false; break; } s = s.replace(a, b); }
    if (!pose) { ko++; console.log('   ROUGE  défaut non posé (ancre introuvable ou multiple) : ' + nom); continue; }
    const f = path.join(os.tmpdir(), 'mv-robpil-contre-' + process.pid + '-' + ok + ko + '.js');
    fs.writeFileSync(f, s);
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, MV_ROB_CIBLE: f }, encoding: 'utf8', timeout: 240000 });
    fs.unlinkSync(f);
    if (r.status !== 0 && /ROUGE/.test(r.stdout || '')) { ok++; console.log('   vert   rougit : ' + nom); }
    else { ko++; console.log('   ROUGE  RESTE VERT : ' + nom + '\n' + String(r.stdout || '').slice(-600) + String(r.stderr || '').slice(-600)); }
  }
  console.log('\n──────────────────────────────\n  ' + ok + ' vert · ' + ko + ' rouge');
  process.exit(ko ? 1 : 0);
}

// ── L'application entière, par le chargeur partagé des harnais ROB-2 (mv-app-node.mjs) ──
const A = await chargerApp({ remplace: Object.assign({ 'pilotage.js': CIBLE }, APP_CIBLE ? { 'app.js': APP_CIBLE } : {}) });
const { G, els, mem, JOURNAL_ERR, _D } = A;

let ok = 0, ko = 0;
const T = (nom, c, d) => { if (c) ok++; else { ko++; console.log('   ROUGE  ' + nom + (d ? '  → ' + d : '')); } };
T('le Pilotage est exposé (renderPilotage, _pilSetTab, _PIL_TABS)', typeof G.renderPilotage === 'function' && typeof G._pilSetTab === 'function' && Array.isArray(G._PIL_TABS));
const ONGLETS = (G._PIL_TABS || []).map(t => t[0]);
const SOUS_ECO = ['syn', 'pos', 'par', 'rev', 'ach', 'exe'];
const SALE = ['undefined', 'NaN', '[object Object]', 'Infinity'];
const sale = h => SALE.filter(m => h.indexOf(m) !== -1).map(m => m + ' : …' + h.slice(Math.max(0, h.indexOf(m) - 60), h.indexOf(m) + 15).replace(/\s+/g, ' ') + '…');
const vider = o => { for (const k of Object.keys(o)) delete o[k]; return o; };
function rendre(onglet, sous, axe) {
  for (const k of Object.keys(els)) delete els[k];
  mem['mavigne_pec_default'] = JSON.stringify({ sub: sous || 'syn', axe: axe || 'ate', psort: 'budget', pdir: -1 });
  G._pilSetTab(onglet, true);
  G.renderPilotage();
  return Object.values(els).map(e => (e.innerHTML || '') + (e.textContent || '')).join('\n');
}

// ── Le domaine ──────────────────────────────────────────────────────────────
// Les données entrent par le VRAI chemin de Firestore : applyFbData (app.js), qui
// synchronise aussi les variables internes d'app.js (JOURNAL, SESSIONS…). Écrire
// window.X directement laisserait app.js lire ses copies d'avant.
function poser(d) {
  const A = G.applyFbData;
  const cles = { membres: d.MEMBRES || [], parcelles: d.PARCELLES || [], saisons: d.SAISONS || [], config: d.CONFIG || {},
    journal: d.JOURNAL || [], sessions: d.SESSIONS || [], traitements: d.TRAITEMENTS || [], activites: d.ACTIVITES || [],
    historique: d.HISTORIQUE || [], tracteurs_list: d.TRACTEURS_LIST || [], entretiens: d.ENTRETIENS || [], reparateur: d.REP || {},
    reparateur_hist: d.REPARATEUR_HIST || {}, planning_templates: d.PT || {}, planning_entries: d.PE || {}, planning_hsup: d.PH || {},
    planning_acomptes: {}, cave_elevage: d.CE || { cuvees: [], operations: [], config: {} }, cave_vendange: d.CV || {}, intrants: d.IN || {}, paie: d.PAIE || {} };
  for (const [k, v] of Object.entries(cles)) {
    const j0 = JOURNAL_ERR.length;
    try { A(k, JSON.parse(JSON.stringify(v))); }
    catch (e) { throw new Error('applyFbData(' + k + ') : ' + e.message); }
    JOURNAL_ERR.length = j0;       // ce qu'applyFbData journalise en chargeant n'est pas le Pilotage
  }
}

function modele(an, rnd) {
  const t = { _timings: {} };
  for (let m = 0; m < 12; m++) { t[m] = {}; t._timings[m] = { d: '07:30', f: '16:00' }; const nd = new _D(an, m + 1, 0).getDate();
    for (let d = 1; d <= nd; d++) { const w = new _D(an, m, d).getDay(); t[m][d] = (w >= 1 && w <= 5) ? (rnd ? [7, 7, 8, 7.5][Math.floor(rnd() * 4)] : 7) : 0; } }
  return t;
}
function domaineFixe() {
  return {
    MEMBRES: [{ nom: 'Nico', statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard', roles: ['admin', 'ouvrier'] },
      { nom: 'Victor', statut: 'Actif', type_contrat: 'CDI', planning_id: 'standard', roles: ['ouvrier', 'tractoriste'] }],
    PARCELLES: [{ nom: 'Les Grandes Vignes', surface: 0.42, lat: 47.22, lng: 4.97, statut: 'Actif', cepage: 'Pinot noir', taches: { Taille: 'Validé', Ebourgeonnage: { p1: 'Validé', p2: 'Non démarré', ov: false } } },
      { nom: 'Clos Bas', surface: 1.1, lat: 47.21, lng: 4.96, statut: 'Actif', taches: { Taille: 'En cours' } }],
    SAISONS: [{ nom: 'Hiver 2025-2026', active: false, debut: '2025-11-01', fin: '2026-03-15' }, { nom: 'Printemps 2026', active: true, debut: '2026-03-16', fin: '2026-10-31' }],
    JOURNAL: [{ id: 'a1', date: '2026-09-20', parcelle: 'Clos Bas', tache: 'Taille', qui: 'Nico', statut: 'Validé', equipe: false, membresEquipe: [] }],
    SESSIONS: [{ id: 's1', date: '2026-09-21', activite: 'Rognage', conducteur: 'Victor', statut: 'En cours', avancement: 40, parcellesFaites: ['Clos Bas'], tracteurId: 'tr1' }],
    TRACTEURS_LIST: [{ id: 'tr1', nom: 'Enjambeur', type: 'Enjambeur', compteur_h: 1200, revision_h: 1250 }],
    ACTIVITES: [{ nom: 'Rognage', tracteurDefautId: 'tr1' }],
    CONFIG: { domaine_nom: 'Domaine test', gnr: { capacite: 1000, niveau: 600, seuil: 200, maj: '2026-06-01' } },
    PT: { 2026: { standard: modele(2026) } }, PE: {}, PH: {},
    CE: { cuvees: [{ id: 'c1', nom: 'Gevrey VV', millesime: 2025, tonneaux: 6, statut: 'elevage' }], operations: [], config: { ouillage_alerte_j: 14 } },
  };
}

// ═══ A. BASE VIDE, BASE FIXE ════════════════════════════════════════════════
console.log('\nA. Chaque onglet sur une base vide, puis sur une base fixe');
const essayer = (lib, fn, echecs) => {
  const j0 = JOURNAL_ERR.length;
  try { for (const x of sale(fn())) echecs.push(lib + ' — ' + x); }
  catch (e) { echecs.push(lib + ' — ' + e.message + ' @ ' + String((e.stack || '').split('\n')[1] || '').trim().replace(/.*\//, '')); }
  for (const o of JOURNAL_ERR.slice(j0)) echecs.push(lib + ' — erreur journalisée : ' + String(o.msg || o.cat || '').slice(0, 120));
};
for (const [lib, d] of [['vide', {}], ['fixe', domaineFixe()]]) {
  poser(d);
  const E = [];
  for (const o of ONGLETS) essayer(o, () => rendre(o), E);
  for (const s of SOUS_ECO) essayer('eco › ' + s, () => rendre('eco', s), E);
  T('A · base ' + lib + ' : ' + (ONGLETS.length + SOUS_ECO.length) + ' vues sans plantage ni valeur sale', E.length === 0, E.slice(0, 8).join(' | '));
  if (lib === 'fixe') {
    // Le harnais ne vaut que si les données ARRIVENT aux écrans : un rendu vide est toujours propre.
    const hAvc = rendre('avc'), hEqu = rendre('equ'), hArc = rendre('arc');
    T('A · base fixe : la campagne lit le vignoble (2 parcelles, 1,52 ha) et le barème', /2 parcelles · 1,52\u00a0?\s?ha|2 parcelles · 1,52 ha/.test(hAvc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')) && /h de barème/.test(hAvc));
    T('A · base fixe : l\u2019équipe lit les fiches et le matériel', /Victor/.test(hEqu) && /Enjambeur/.test(hEqu));
    T('A · base fixe : les archives lisent les périodes', /Printemps 2026/.test(hArc));
  }
}

// ═══ B. DES DOMAINES TIRÉS AU HASARD ════════════════════════════════════════
console.log('\nB. ' + N + ' domaines tirés au hasard × ' + ONGLETS.length + ' onglets + ' + SOUS_ECO.length + ' vues Économie × 2 axes');
let graine = 1; const rnd = () => { graine = (graine * 1103515245 + 12345) & 0x7fffffff; return graine / 0x7fffffff; };
const pick = a => a[Math.floor(rnd() * a.length)];
const peutEtre = (p, v) => rnd() < p ? v : undefined;
const iso = (y, m, d) => y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
const unJour = () => iso(pick([2025, 2026, 2026, 2026]), Math.floor(rnd() * 12), 1 + Math.floor(rnd() * 28));
const nombre = () => pick([0.5, 1.2, 3, '0,8', '1.5', null, undefined, -1, 0, 12]);
const STATUTS = ['Validé', 'En cours', 'Non démarré', 'Annulé', 'Info', undefined, 'bizarre'];
function domaineAuHasard() {
  const noms = ['Nico', 'Victor', 'Alicia', "Jean d'Arc", 'Équipe V'].slice(0, 2 + Math.floor(rnd() * 4));
  const MEMBRES = noms.map((nom, i) => {
    const m = { nom, statut: rnd() < .15 ? 'Inactif' : 'Actif', type_contrat: pick(['CDI', 'CDI', 'CDD', 'Saisonnier', 'Apprenti', undefined]), planning_id: rnd() < .05 ? 'inexistant' : 'standard', roles: pick([['ouvrier'], ['admin', 'ouvrier'], ['tractoriste'], [], undefined]) };
    if (nom === 'Équipe V') { m.collectif = true; m.effectif = pick([5, 30, '12', 0, undefined]); }
    if (rnd() < .3) { m.debut_contrat = unJour(); if (rnd() < .6) m.fin_contrat = unJour(); }
    if (rnd() < .1) m.bureau = true;
    if (rnd() < .15) m.contrats = [{ debut: '2026-01-05', fin: '2026-04-30', type: 'CDD' }, pick([{}, null, { debut: '2026-06-01' }])];
    if (i === 0 && rnd() < .1) m.nom = undefined;
    return m;
  });
  const PARCELLES = [];
  for (let i = 0; i < 2 + Math.floor(rnd() * 8); i++) {
    const p = { nom: 'Parcelle ' + i, surface: nombre(), lat: 47.2 + rnd() / 50, lng: 4.9 + rnd() / 50, statut: pick(['Actif', 'Actif', 'Arrachee', undefined]), taches: {} };
    if (rnd() < .05) p.nom = pick([undefined, '', null]);
    for (const t of ['Taille', 'Tirage', 'Reparation', 'Pliage', 'Palissage', 'Rognage', 'Vendange']) if (rnd() < .5) p.taches[t] = pick(STATUTS);
    if (rnd() < .4) p.taches.Ebourgeonnage = pick([{ p1: 'Validé', p2: 'Non démarré', ov: false }, { p1: 'En cours' }, {}, null, 'Validé']);
    if (rnd() < .1) p.taches = pick([null, undefined, [], 'x']);
    if (rnd() < .3) p.cepage = pick(['Pinot noir', 'Chardonnay', '', null]);
    if (rnd() < .2) p.appellation = pick(['Gevrey-Chambertin', 'Bourgogne', null]);
    if (rnd() < .2) p.rdt_hist = pick([{ 2025: 38 }, { 2025: '35' }, null, []]);
    PARCELLES.push(p);
  }
  const SAISONS = [{ nom: 'Hiver 2025-2026', active: false, debut: '2025-11-01', fin: '2026-03-15' }, { nom: 'Printemps 2026', active: true, debut: '2026-03-16', fin: '2026-07-31' }];
  if (rnd() < .5) SAISONS.push({ nom: 'Vendanges 2026', active: false, debut: '2026-08-01', fin: '2026-10-31' });
  if (rnd() < .15) SAISONS.push(pick([{ nom: 'Sans dates' }, { nom: 'À l’envers', debut: '2026-10-01', fin: '2026-09-01' }, null]));
  if (rnd() < .1) SAISONS.forEach(s => { if (s) s.active = false; });
  const JOURNAL = [];
  for (let i = 0; i < Math.floor(rnd() * 40); i++) {
    const e = { id: 'j' + i, date: unJour(), parcelle: pick(PARCELLES.map(p => p.nom).concat(['Domaine', 'Inconnue'])), tache: pick(['Taille', 'Palissage', 'Rognage', 'Vendange', 'Météo', 'Réparation ponctuelle', undefined]), qui: pick(noms.concat(['Auto'])), statut: pick(STATUTS), equipe: rnd() < .2 };
    if (e.equipe) e.membresEquipe = pick([noms.slice(0, 2), [], null]);
    if (rnd() < .3) { e.ts_debut = new _D(2026, 8, 1).getTime(); e.ts_fin = e.ts_debut + pick([3600e3, 7200e3, -1, 0]); }
    if (rnd() < .2) e.duree_h = nombre();
    if (e.tache === 'Météo') { e.meteo = true; e.temp = pick([18, '17', null]); e.desc = 'Nuageux'; }
    if (rnd() < .05) e.date = pick([undefined, '', '2026-13-45', null]);
    JOURNAL.push(e);
  }
  const TRACTEURS_LIST = [{ id: 'tr1', nom: 'Enjambeur', type: 'Enjambeur', compteur_h: nombre(), revision_h: nombre(), traitementOnly: false }];
  if (rnd() < .5) TRACTEURS_LIST.push({ id: 'tr2', nom: 'Tracteur', type: 'Tracteur', traitementOnly: rnd() < .3 });
  const SESSIONS = [];
  for (let i = 0; i < Math.floor(rnd() * 12); i++) SESSIONS.push({ id: 's' + i, date: unJour(), activite: pick(['Rognage', 'Traitement', 'Labour', undefined]), conducteur: pick(noms), statut: pick(['En cours', 'Terminée', undefined]),
    avancement: pick([0, 40, 100, '50', null]), parcellesFaites: pick([PARCELLES.slice(0, 2).map(p => p.nom), PARCELLES.slice(0, 1).map(p => ({ nom: p.nom })), [], null]), tracteurId: pick(['tr1', 'tr2', 'absent', undefined]), duree_h: nombre() });
  const ENTRETIENS = rnd() < .5 ? [{ id: 'e1', tracteurId: 'tr1', date: unJour(), type: 'quotidien' }, pick([{}, null, { tracteurId: 'tr1' }])] : [];
  const TRAITEMENTS = [];
  for (let i = 0; i < Math.floor(rnd() * 6); i++) TRAITEMENTS.push({ id: 't' + i, date: unJour(), parcelles: pick([PARCELLES.slice(0, 2).map(p => p.nom), [], null]), produits: pick([[{ nom: 'Cuivre', dose: 0.5, unite: 'kg/ha' }], [{ nom: 'Soufre' }], [], null]), surface: nombre() });
  // Un OBJET par tracteur (tracteur.js : REPARATEUR_HIST[t.id].unshift({depuis, retour, motif, four, eur?})).
  const REPARATEUR_HIST = rnd() < .3 ? { tr1: [{ depuis: unJour(), retour: unJour(), motif: 'embrayage', four: 'Garage', eur: pick([850, '850', undefined]) }] } : {};
  // Archives de clôture : forme du jour (arcV 2), formes d'avant, et abîmées.
  const HISTORIQUE = [];
  for (const s of SAISONS.filter(x => x && x.nom && rnd() < .6)) HISTORIQUE.push(pick([
    { saisonNom: s.nom, archivedAt: '2026-08-01T10:00:00Z', arcV: 2, parcelles: PARCELLES.slice(0, 2), journal: JOURNAL.slice(0, 5), sessions: SESSIONS.slice(0, 2), taches: [], travaux: {}, stats: { hFaites: pick([120, '80', null, 0]), nbEntrees: 5 } },
    { saisonNom: s.nom, archivedAt: '2025-08-01T10:00:00Z', parcelles: PARCELLES, journal: JOURNAL, sessions: SESSIONS, stats: { hFaites: 50 } },
    { saisonNom: s.nom }, { saisonNom: s.nom, stats: null, parcelles: null }]));
  if (rnd() < .1) HISTORIQUE.push(null);
  const CONFIG = {
    domaine_nom: pick(['Domaine test', '', undefined]),
    gnr: pick([{ capacite: 1000, niveau: 600, seuil: 200, maj: '2026-06-01' }, { capacite: '1000', niveau: null }, null, undefined]),
    eco: pick([undefined, {}, { kg_bouteille: 1.3, h_jour: 7, exercice_mois: 7, campagne_mois: 8, pertes_elevage: 5, autres_charges: 2000 }, { h_jour: '7', exercice_mois: 13, campagne_mois: 'x' }]),
    objectifs_fin: pick([undefined, {}, { Taille: '2026-03-31' }, { Taille: 'pas une date' }]),
    task_windows: pick([undefined, {}, { Taille: { debut: '2025-12-01', fin: '2026-03-15' } }, { Taille: null }]),
    ordre_passage_t: pick([undefined, {}, { Taille: ['Parcelle 0', 'Parcelle 9'] }, { Taille: 'x' }]),
    conformite: pick([undefined, {}, { ift_ref: 12 }]),
    hsup_mode: pick(['paye', 'recup', undefined]), cp_mode: pick(['ouvrables', 'ouvres', undefined]),
  };
  const tpl = modele(2026, rnd);
  const PE = {};
  for (const m of MEMBRES) if (m && m.nom) { const y = {}; for (let mo = 0; mo < 12; mo++) { y[mo] = {}; for (let d = 1; d <= 28; d++) if (rnd() < .15) y[mo][d] = pick([{ type: 'cp', heures: 7 }, { type: 'recup' }, { absent: true, motif: pick(['arret', 'perso', 'inconnu', undefined]), comment: pick(['maladie', '', undefined]) }, { timing: { debut: '07:00', fin: '17:00' } }, { timing: null }, {}]); } PE[m.nom] = { 2026: y }; }
  const CE = pick([
    { cuvees: [{ id: 'c1', nom: 'Gevrey VV', millesime: 2025, tonneaux: 6, statut: 'elevage', last_ouillage: unJour() }, { id: 'c2', nom: 'Bourgogne', millesime: '2024', tonneaux: null, statut: pick(['bouteille', 'elevage', undefined]) }],
      operations: [{ id: 'o1', type: pick(['ouillage', 'analyse', 'soutirage', 'inconnu']), date: unJour(), cuvee: 'c1', data: pick([{ so2_libre: 25, av: 0.4 }, {}, null]) }], config: pick([{ ouillage_alerte_j: 14 }, {}, null]) },
    { cuvees: [], operations: [], config: {} }, { cuvees: null }, {}]);
  const CV = pick([{}, { vendanges: [], analyses: [] }, { vendanges: [{ id: 'v1', parcelle: 'Parcelle 0', date: '2026-09-15', kg: pick([1200, '900', null]), lignes: pick([[{ kg: 1200 }], null]) }], analyses: [{ parcelle: 'Parcelle 0', date: '2026-09-10', mode: 'sucre', val: 190 }] }, { vendanges: null }]);
  const IN = pick([{}, { futs: [], stock: [] }, { futs: [{ id: 'f1', annee: 2024, prix: pick([900, '850', null]), statut: 'plein' }], achats: pick([[{ date: '2026-03-01', montant: 1200, nature: 'phyto' }], null]) }, { futs: null }]);
  const PAIE = pick([{}, { taux: { CDI: 14.5, CDD: 13.2 } }, { taux: { CDI: '14,5' } }, { taux: null }]);
  // Un élément nul ou d'un autre type DANS une liste. Le 28/09 ce tirage a fait tomber TOUTE la page
  //   (pilotage.js `_pilData` sur un tracteur nul ; app.js `_parcConcern` sur une parcelle nulle).
  //   ★ LISTES-1 : applyFbData écarte ces éléments à l'entrée (app.js, _mvListeObjets). Section C.
  for (const L of [PARCELLES, JOURNAL, SESSIONS, TRAITEMENTS, ENTRETIENS, TRACTEURS_LIST]) if (rnd() < .08) L.push(pick([null, 'x', 0, [], {}]));
  return { MEMBRES, PARCELLES, SAISONS, JOURNAL, SESSIONS, TRACTEURS_LIST, ENTRETIENS, TRAITEMENTS, HISTORIQUE, REPARATEUR_HIST, ACTIVITES: [{ nom: 'Rognage', tracteurDefautId: 'tr1' }],
    CONFIG, PT: { 2026: { standard: tpl } }, PE, PH: {}, CE, CV, IN, PAIE, REP: rnd() < .2 ? { tr1: { depuis: unJour() } } : {} };
}
// Réglages mémorisés par le module (formes d'avant, abîmées)
const ETATS = [null, '{}', 'pas du json', JSON.stringify({ show: { avc_etp: 0 }, pie: 'fait' }), JSON.stringify({ show: null, pie: 'inconnu', v: 1 })];
const ONGLETS_MEMO = [null, 'auj', 'prs', 'mat', 'ecf', 'cav', 'param', 'inconnu'];

const ECHECS = new Map();
// Une même cause rougit dans toutes les vues qui passent par elle : on groupe par CAUSE,
// en gardant la première vue et la première graine qui la montrent.
const note = (quoi, s, msg) => { if (!ECHECS.has(msg)) ECHECS.set(msg, { s, quoi, vues: new Set() }); ECHECS.get(msg).vues.add(quoi); };
let appels = 0;
for (let s = 1; s <= N; s++) {
  graine = s;
  poser(domaineAuHasard());
  A.setAuj(pick([[2026, 8, 27], [2026, 0, 3], [2026, 5, 15], [2026, 11, 31]]));
  const e = pick(ETATS); if (e === null) delete mem['mavigne_pilote_default_Nico']; else mem['mavigne_pilote_default_Nico'] = e;
  const t = pick(ONGLETS_MEMO); if (t === null) delete mem['mavigne_pil_tab_default']; else mem['mavigne_pil_tab_default'] = t;
  const vues = ONGLETS.map(o => [o, null, null]);
  for (const sv of SOUS_ECO) for (const ax of ['ate', 'nat']) vues.push(['eco', sv, ax]);
  for (const [o, sv, ax] of vues) {
    appels++;
    const lib = o + (sv ? ' › ' + sv + ' (' + ax + ')' : '');
    const j0 = JOURNAL_ERR.length;
    try { for (const x of sale(rendre(o, sv, ax))) note(lib, s, x); }
    catch (err) { note(lib, s, err.message + ' @ ' + String((err.stack || '').split('\n')[1] || '').trim().replace(/.*\//, '')); }
    for (const x of JOURNAL_ERR.slice(j0)) note(lib, s, 'erreur journalisée : ' + String(x.msg || x.cat || '').slice(0, 120));
  }
}
T('B1 · ' + appels + ' rendus : aucun plantage, aucune erreur journalisée, rien de sale à l\u2019écran', ECHECS.size === 0,
  [...ECHECS].slice(0, 15).map(([k, v]) => '\n        graine ' + v.s + ', ' + v.quoi + (v.vues.size > 1 ? ' (+' + (v.vues.size - 1) + ' vues)' : '') + ' — ' + k).join(''));

// ═══ C. LISTES-1 : UNE LISTE NE PORTE QUE DES FICHES ═══════════════════════
console.log('\nC. LISTES-1 — applyFbData écarte ce qui n\u2019est pas une fiche');
{
  const traces = [];
  const avant = G.logError; G.logError = o => { traces.push(o); };
  try {
    G.applyFbData('tracteurs_list', [{ id: 'tr1', nom: 'Enjambeur' }, null, 'x', 3, ['a'], { id: 'tr2', nom: 'Tracteur' }]);
    G.applyFbData('parcelles', [{ nom: 'A', surface: 1, statut: 'Actif', taches: {} }, null]);
    G.applyFbData('journal', [{ id: 'j', date: '2026-09-01' }]);
  } finally { G.logError = avant; }
  const tl = G.TRACTEURS_LIST || [];
  T('C1 · les éléments illisibles sont écartés, les fiches gardées dans l\u2019ordre', tl.length === 2 && tl[0].id === 'tr1' && tl[1].id === 'tr2', JSON.stringify(tl));
  T('C2 · une parcelle nulle n\u2019entre pas', (G.PARCELLES || []).length === 1 && G.PARCELLES[0].nom === 'A');
  const L1 = traces.filter(o => /LISTES-1/.test(o.msg || ''));
  T('C3 · une trace par liste abîmée, aucune pour une liste saine', L1.length === 2 && L1.some(o => /tracteurs_list/.test(o.msg)) && L1.some(o => /parcelles/.test(o.msg)), JSON.stringify(L1.map(o => o.msg)));
  const t0 = L1.find(o => /tracteurs_list/.test(o.msg)) || {};
  T('C4 · la trace dit les types écartés (1 null, 1 string, 1 number, 1 tableau), sans leur contenu', /4 élément/.test(t0.msg || '') && /1 null/.test(t0.detail || '') && /1 string/.test(t0.detail || '') && /1 number/.test(t0.detail || '') && /1 tableau/.test(t0.detail || '') && !/"x"|'x'/.test(JSON.stringify(t0)), JSON.stringify(t0));
  let e = null; try { rendre('auj'); rendre('equ'); } catch (x) { e = x; }
  T('C5 · après ce chargement, le Pilotage se rend', !e, e && e.message);
}

console.log('\n──────────────────────────────\n  ' + ok + ' vert · ' + ko + ' rouge');
process.exit(ko ? 1 : 0);
