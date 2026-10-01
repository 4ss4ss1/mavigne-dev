/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — LE TEMPS RÉELLEMENT PASSÉ DANS CHAQUE PARCELLE (lot TV-1, §172)
   Lancer : node scripts/mv-harnais-temps-vigne.mjs
            node scripts/mv-harnais-temps-vigne.mjs --contre

   ══ POURQUOI ══
   Nico, 23/09/2026 : « il faudrait que le moteur calcule le nombre de vignes
   validées en une journée pour faire un prorata du temps passé dans chaque
   parcelle en fonction du nombre d'heures comptées sur le planning ». Précisé :
   une validation vaut pour tout le groupe nommé ; plusieurs parcelles le même
   jour se partagent AU PRORATA DE LA SURFACE (3 × 8 h sur 1 + 0,5 + 0,5 ha =
   12 h/ha contre 15 au barème).

   ══ CE QU'IL TIENT ══
     A. On EXÉCUTE les vraies fonctions extraites de src/pilotage.js (méthode C20) :
        _ecoTempsVigne, _ecoTvEvents, _ecoTvBar, _ecoTvNivs, _ecoTvDef et les dates.
        Le planning, les sessions et les contrats sont des stubs qui RENDENT des
        données — ils ne calculent rien de métier.
     B. Les branchements : la carte lit le moteur, la fiche existe et est posée,
        le cache est oublié à la repeinte, _ecoTracHByParc expose condH.

     D. ENG-2 : l'euro engagé au taux du jour, les journées de cave retirées (intervenants
        seulement, jamais operateur ni analyse) ; _pecData et la courbe les lisent.
     R. RÉAL-1 (§188) : les euros suivent les heures jusqu'au travail et à la parcelle (le
        « Réalisé » des tableaux) ; une revalidation d'une tâche simple ne recompte pas le barème.
     P. PAR-1 (§198) : la journée se partage entre TOUTES les parcelles validées ce jour-là, au prorata
        du BARÈME — un salarié non nommé rejoint la journée du domaine ; le groupe nommé garde ses parcelles ;
        le décoché (quiHors) reste en attente.
     Q. ÉQUIPES-1 (§199) : un jour d'équipes posées par l'admin, pas de journée du domaine ; une
        validation sans groupe prend l'équipe du jour de son auteur ; un groupe écrit l'emporte.
     C. TV-2 : le validateur administrateur peut se décocher (`quiHors`). Moteur exécuté ;
        les cinq chemins d'écriture d'app.js et les lecteurs du groupe lus sans commentaires.

   ⚠️ §25.2 : les contre-épreuves mutent EN MÉMOIRE, avec garde d'injection —
      une mutation qui ne trouve pas son ancre est une ERREUR, jamais un vert.
   ⚠️ CHEMINS : fileURLToPath, jamais new URL(...).pathname (Windows, 20/08).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const BASE = { pil: lire('src/pilotage.js'), utl: lire('src/utils.js'), app: lire('src/app.js'), reg: lire('src/reglages.js') };

function extraire(src, nom) {
  const i = src.indexOf('function ' + nom + '(');
  if (i < 0) return null;
  let d = 0; const s = src.indexOf('{', i);
  for (let k = s; k < src.length; k++) {
    if (src[k] === '{') d++;
    else if (src[k] === '}') { d--; if (!d) return src.slice(i, k + 1); }
  }
  return null;
}
const nu = s => s.split('\n').filter(l => !l.trimStart().startsWith('//')).join('\n');

const VOULUES = ['_ecoCaveJours', '_pexIso', '_pexD', '_pexIsoToMs2', '_pexIsoPlus', '_pexJourApres', '_opPassHha', '_opMinTrou',
  '_ecoTvNivs', '_ecoTvDef', '_ecoTvBar', '_ecoTvEvents', '_ecoTempsVigne'];

/* Stubs : ils RENDENT des données. HEURES[nom][iso] = heures dans les rangs ce jour ;
   COND[nom][iso] = heures de conduite ; la période est en janvier 2026 (passée). */
const PRELUDE = `
var window = { PARCELLES:[], JOURNAL:[], MEMBRES:[], TACHES:[] };
var HEURES = {}, COND = {}, PER = { nom:'Hiver', debut:'2026-01-05', fin:'2026-01-16' };
var TAUX = {}, RATE0 = 18, EQJ = {};
window._mvEqJour = function(iso){ var L=EQJ[iso]; return (L&&L.length)?L:null; };
function _ecoRate(){ return RATE0; }
window._mvPaieTauxEffAt = function(m, iso){ var t=TAUX[m.nom]; if(typeof t==='function') return t(iso); return t||0; };
var _ECO_TV = null;
window._pilSaison = function(){ return PER; };
window._mvEnContratSurPeriode = function(m){ return !m.bureau; };
window._planChampPersRange = function(m, a, b){
  var iso = a.getFullYear()+'-'+String(a.getMonth()+1).padStart(2,'0')+'-'+String(a.getDate()).padStart(2,'0');
  return ((HEURES[m.nom]||{})[iso])||0;
};
function _ecoTracHByParc(){ return { condH: COND }; }
`;

function charger(src) {
  const morceaux = [], manque = [];
  for (const n of VOULUES) { const f = extraire(src.pil, n); if (f) morceaux.push(f); else manque.push(n); }
  if (manque.length) return { manque };
  const code = PRELUDE + morceaux.join('\n') + `
;return { tv: function(){ _ECO_TV=null; return _ecoTempsVigne(); },
  set: function(o){ Object.assign(window, o.w||{}); if(o.h) HEURES=o.h; if(o.c) COND=o.c; if(o.per) PER=o.per; if(o.t) TAUX=o.t; if(o.eq) EQJ=o.eq; } };`;
  return { M: new Function(code)() };
}

const P = (nom, surf) => ({ nom, surface: surf });
const TACHES = [ { nom: 'Taille', hha: 15 },
  { nom: 'Relevage', type: 'niveaux', niveaux: [{ num: 1, hha: 25 }, { num: 2, hha: 55 }, { num: 3, hha: 15 }] } ];
const MBR = [{ nom: 'Victor' }, { nom: 'Shana' }, { nom: 'Alicia' }, { nom: 'Chloé', bureau: true }];
const jours = (arr, h) => Object.fromEntries(arr.map(d => [d, h]));

function scenarios(M) {
  const R = [], eq = (n, a, b) => R.push([n + (Math.abs(a - b) < 1e-6 ? '' : ' — obtenu ' + a + ', attendu ' + b), Math.abs(a - b) < 1e-6]);
  const ok = (n, c) => R.push([n, !!c]);
  const hp = (V, parc, t) => ((V.pairs[parc + '\u0000' + t] || {}).h) || 0;

  // ── A1 : l'exemple de Nico, une journée, trois parcelles ────────────────
  M.set({ w: { PARCELLES: [P('A', 1), P('B', 0.5), P('C', 0.5)], TACHES, MEMBRES: MBR,
    JOURNAL: ['A', 'B', 'C'].map((p, i) => ({ id: (0x100 + i).toString(16), date: '2026-01-05', parcelle: p, tache: 'Taille',
      qui: 'Victor', statut: 'Validé', equipe: true, membresEquipe: ['Shana', 'Alicia'] })) },
    h: { Victor: jours(['2026-01-05'], 8), Shana: jours(['2026-01-05'], 8), Alicia: jours(['2026-01-05'], 8), Chloé: jours(['2026-01-05'], 7) },
    c: {} });
  let V = M.tv();
  eq('A1 · 1 ha : 12 h (24 h au prorata de la surface)', hp(V, 'A', 'Taille'), 12);
  eq('A2 · 0,5 ha : 6 h', hp(V, 'B', 'Taille'), 6);
  eq('A3 · 0,5 ha : 6 h', hp(V, 'C', 'Taille'), 6);
  const tT = V.taches.find(t => t.nom === 'Taille') || {};
  eq('A4 · h/ha réel de la taille : 12', tT.hhaR, 12);
  eq('A5 · h/ha barème : 15', tT.hhaB, 15);
  eq('A6 · écart : -20 %', tT.ecart, -20);
  ok('A7 · le bureau n\'entre pas (Chloé)', !V.gens.some(g => g.nom === 'Chloé'));
  eq('A8 · rien en attente', V.hAtt, 0);

  // ── B : plusieurs jours, validation en fin ; tracteur ; congé ; attente ─
  M.set({ w: { PARCELLES: [P('D', 1), P('E', 2)], TACHES, MEMBRES: [{ nom: 'Victor' }],
    JOURNAL: [ { id: '200', date: '2026-01-07', parcelle: 'D', tache: 'Taille', qui: 'Victor', statut: 'Validé', membresEquipe: [] } ] },
    h: { Victor: { '2026-01-05': 8, '2026-01-06': 0, '2026-01-07': 8, '2026-01-08': 8, '2026-01-09': 8 } },
    c: { Victor: { '2026-01-05': 3 } } });
  V = M.tv();
  eq('B1 · trois jours cumulés, congé à 0, tracteur retiré : 5 + 0 + 8 = 13 h sur D', hp(V, 'D', 'Taille'), 13);
  eq('B2 · la conduite est comptée à part : 3 h', V.hTrac, 3);
  eq('B3 · après la dernière validation : 16 h en attente', V.hAtt, 16);
  eq('B4 · INVARIANT : versé + attente = rangs − conduite', V.hAff + V.hAtt, V.hChamp - V.hTrac);

  // ── C : relevage, listes cumulatives, statut « En cours » ──────────────
  M.set({ w: { PARCELLES: [P('F', 1)], TACHES, MEMBRES: [{ nom: 'Shana' }],
    JOURNAL: [
      { id: '300', date: '2026-01-06', parcelle: 'F', tache: 'Relevage', qui: 'Shana', statut: 'En cours', niveaux: [1] },
      { id: '301', date: '2026-01-08', parcelle: 'F', tache: 'Relevage', qui: 'Shana', statut: 'En cours', niveaux: [1, 2] },
      { id: '302', date: '2026-01-09', parcelle: 'F', tache: 'Relevage', qui: 'Shana', statut: 'En cours', niveaux: [1, 2] } ] },
    h: { Shana: jours(['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09'], 7) }, c: {} });
  V = M.tv();
  eq('C1 · deux clôtures seulement (la 3e n\'ajoute aucun niveau)', V.nEv, 2);
  const tR = V.taches.find(t => t.nom === 'Relevage') || {};
  eq('C2 · barème = niveau 1 (25) + niveau 2 (55), pas 25 + 80', tR.bar, 80);
  eq('C3 · heures versées : 14 + 14 = 28 ; le 9 attend', tR.h, 28);
  eq('C4 · le 9 janvier reste en attente : 7 h', V.hAtt, 7);

  // ── D : annulation ─────────────────────────────────────────────────────
  M.set({ w: { PARCELLES: [P('G', 1), P('H', 1)], TACHES, MEMBRES: [{ nom: 'Alicia' }],
    JOURNAL: [
      { id: '400', date: '2026-01-05', parcelle: 'G', tache: 'Taille', qui: 'Alicia', statut: 'Validé' },
      { id: '401', date: '2026-01-05', parcelle: 'G', tache: 'Taille', qui: 'Alicia', statut: 'Annulé' },
      { id: '402', date: '2026-01-06', parcelle: 'H', tache: 'Taille', qui: 'Alicia', statut: 'Validé' } ] },
    h: { Alicia: jours(['2026-01-05', '2026-01-06'], 7) }, c: {} });
  V = M.tv();
  eq('D1 · la validation annulée ne reçoit rien', hp(V, 'G', 'Taille'), 0);
  eq('D2 · les heures vont à la validation suivante : 14 h sur H', hp(V, 'H', 'Taille'), 14);

  // ── E : la validation « Domaine » et une parcelle inconnue n'entrent pas ─
  M.set({ w: { PARCELLES: [P('I', 1)], TACHES, MEMBRES: [{ nom: 'Victor' }],
    JOURNAL: [ { id: '500', date: '2026-01-05', parcelle: 'Domaine', tache: 'Taille', qui: 'Victor', statut: 'Validé' },
               { id: '501', date: '2026-01-05', parcelle: 'I', tache: 'Taille', qui: 'Victor', statut: 'Validé' } ] },
    h: { Victor: jours(['2026-01-05'], 8) }, c: {} });
  V = M.tv();
  eq('E1 · « Domaine » ignorée : les 8 h vont à I', hp(V, 'I', 'Taille'), 8);

  // ── E2 : TV-2 — le validateur hors des rangs ne reçoit rien ─────────────
  M.set({ w: { PARCELLES: [P('J', 1)], TACHES, MEMBRES: [{ nom: 'Nico' }, { nom: 'Victor' }],
    JOURNAL: [ { id: '600', date: '2026-01-05', parcelle: 'J', tache: 'Taille', qui: 'Nico', quiHors: true, statut: 'Validé',
                 equipe: true, membresEquipe: ['Victor'] } ] },
    h: { Nico: jours(['2026-01-05'], 8), Victor: jours(['2026-01-05'], 8) }, c: {} });
  V = M.tv();
  eq('E2 · quiHors : seules les 8 h de Victor vont à J', hp(V, 'J', 'Taille'), 8);
  eq('E3 · … et celles du validateur restent en attente', (V.gens.find(g => g.nom === 'Nico') || {}).hAtt, 8);
  M.set({ w: { JOURNAL: [ { id: '601', date: '2026-01-05', parcelle: 'J', tache: 'Taille', qui: 'Nico', statut: 'Validé',
                 equipe: true, membresEquipe: ['Victor'] } ] } });
  V = M.tv();
  eq('E4 · entrée d\'avant TV-2 (sans quiHors) : l\'auteur compte, 16 h', hp(V, 'J', 'Taille'), 16);

  // ── E5 : passages — un appui écrit [2], le panneau écrit [1,2] ──────────
  M.set({ w: { PARCELLES: [P('K', 1)], MEMBRES: [{ nom: 'Victor' }],
    TACHES: TACHES.concat([{ nom: 'Pioche', type: 'passages', passagesHha: [10, 8] }]),
    JOURNAL: [
      { id: '700', date: '2026-01-05', parcelle: 'K', tache: 'Pioche', qui: 'Victor', statut: 'En cours', passages: [1] },
      { id: '701', date: '2026-01-06', parcelle: 'K', tache: 'Pioche', qui: 'Victor', statut: 'Validé', passages: [2] },
      { id: '702', date: '2026-01-07', parcelle: 'K', tache: 'Pioche', qui: 'Victor', statut: 'Validé', passages: [1, 2] } ] },
    h: { Victor: jours(['2026-01-05', '2026-01-06', '2026-01-07'], 7) }, c: {} });
  V = M.tv();
  const tP = V.taches.find(t => t.nom === 'Pioche') || {};
  eq('E5 · deux clôtures, pas trois (la liste entière n\'ajoute rien)', V.nEv, 2);
  eq('E6 · barème = passage 1 (10) + passage 2 (8)', tP.bar, 18);
  M.set({ w: { TACHES } });

  // ── I : ENG-2 — l'exemple de Nico : 4 salariés, une semaine, 19 €/h ─────
  const SEM = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-08', '2026-01-09'];
  M.set({ w: { PARCELLES: [P('L', 1)], TACHES, MEMBRES: [{ nom: 'A' }, { nom: 'B' }, { nom: 'C' }, { nom: 'D' }], JOURNAL: [],
    CAVE_ELEVAGE: { operations: [] } },
    h: { A: jours(SEM, 8), B: jours(SEM, 8), C: jours(SEM, 8), D: jours(SEM, 8) }, c: {},
    t: { A: 19, B: 19, C: 19, D: 19 } });
  V = M.tv();
  eq('I1 · 4 × 8 h × 5 j × 19 € = 3 040 € engagés, SANS aucune validation', V.eur, 3040);
  eq('I2 · 160 h dans les rangs', V.hVigne, 160);
  // Taux qui change en cours de semaine, et une fiche sans taux
  M.set({ t: { A: iso => (iso < '2026-01-07' ? 17 : 19), B: 0, C: 19, D: 19 } });
  V = M.tv();
  eq('I3 · taux du JOUR : A = 2 j × 8 × 17 + 3 j × 8 × 19 ; B au taux moyen (18)', V.eur, (2 * 8 * 17 + 3 * 8 * 19) + 40 * 18 + 40 * 19 * 2);
  eq('I4 · une fiche sans taux est signalée', V.nSansTaux, 1);
  // Journée de cave
  M.set({ w: { CAVE_ELEVAGE: { operations: [
      { id: 'o1', type: 'soutirage', date: '2026-01-06', intervenants: ['A', 'B'], operateur: 'Nico' },
      { id: 'o2', type: 'soutirage', date: '2026-01-07', intervenants: [], operateur: 'C' },
      { id: 'o3', type: 'analyse', date: '2026-01-08', intervenants: ['D'] } ] } },
    t: { A: 19, B: 19, C: 19, D: 19 } });
  V = M.tv();
  eq('I5 · deux journées de cave (A, B le 6) retirées : 16 h', V.hCave, 16);
  eq('I6 · … et leurs euros : 3 040 − 16 × 19', V.eur, 3040 - 16 * 19);
  ok('I7 · `operateur` seul ne sort personne de la vigne (C le 7)', !((V.gens.find(g => g.nom === 'C') || {}).hCave > 0));
  ok('I8 · une analyse ne vide pas une journée (D le 8)', !((V.gens.find(g => g.nom === 'D') || {}).hCave > 0));
  // Courbe : les euros au jour, somme = total
  const sD = Object.values(V.byD).reduce((a, b) => a + b, 0);
  eq('I9 · la courbe au jour vaut l\'engagé, au centime', sD, V.eur);
  eq('I10 · rien le 6 pour A et B : 2 × 8 × 19 seulement ce jour-là', V.byD['2026-01-06'], 2 * 8 * 19);
  M.set({ w: { CAVE_ELEVAGE: { operations: [] } }, t: {} });

  // ── R : RÉAL-1 — le réalisé en euros, et la revalidation ──────────────
  M.set({ w: { PARCELLES: [P('M', 1), P('N', 1)], TACHES, MEMBRES: [{ nom: 'Victor' }, { nom: 'Shana' }], CAVE_ELEVAGE: { operations: [] },
    JOURNAL: [
      { id: '800', date: '2026-01-06', parcelle: 'M', tache: 'Taille', qui: 'Victor', statut: 'Validé', membresEquipe: ['Shana'] },
      { id: '801', date: '2026-01-06', parcelle: 'N', tache: 'Taille', qui: 'Victor', statut: 'Validé', membresEquipe: ['Shana'] } ] },
    h: { Victor: jours(['2026-01-05', '2026-01-06', '2026-01-07'], 8), Shana: jours(['2026-01-05', '2026-01-06'], 7) }, c: {},
    t: { Victor: iso => (iso < '2026-01-06' ? 18 : 20), Shana: 17 } });
  V = M.tv();
  const pe = (parc, t) => ((V.pairs[parc + '\u0000' + t] || {}).eur) || 0;
  eq('R1 · M reçoit la moitié des euros payés : (8×18 + 8×20 + 14×17) / 2', pe('M', 'Taille'), (8 * 18 + 8 * 20 + 14 * 17) / 2);
  eq('R2 · le travail porte la somme de ses couples', (V.taches.find(t => t.nom === 'Taille') || {}).eur, 8 * 18 + 8 * 20 + 14 * 17);
  eq('R3 · la parcelle porte ses euros', (V.parcs.N || {}).eur, (8 * 18 + 8 * 20 + 14 * 17) / 2);
  eq('R4 · le 7 (Victor, 8 × 20 €) attend une validation, en euros aussi', V.eAtt, 160);
  eq('R5 · INVARIANT : euros versés + en attente = engagé', V.eAff + V.eAtt, V.eur);
  // Revalidation d'une tâche simple dans la période : les heures y vont, le barème une fois
  M.set({ w: { PARCELLES: [P('O', 2)], JOURNAL: [
      { id: '900', date: '2026-01-05', parcelle: 'O', tache: 'Taille', qui: 'Victor', statut: 'Validé' },
      { id: '901', date: '2026-01-06', parcelle: 'O', tache: 'Taille', qui: 'Victor', statut: 'Validé' } ] },
    h: { Victor: jours(['2026-01-05', '2026-01-06'], 8), Shana: {} }, t: { Victor: 20 } });
  V = M.tv();
  const tO = V.taches.find(t => t.nom === 'Taille') || {};
  eq('R6 · deux validations de la même parcelle : barème compté UNE fois (2 ha × 15)', tO.bar, 30);
  eq('R7 · … mais les heures des deux jours y vont (16 h)', tO.h, 16);
  eq('R8 · … h/ha barème lu juste : 15', tO.hhaB, 15);
  // Annulé entre les deux : la seconde validation recompte
  M.set({ w: { JOURNAL: [
      { id: '910', date: '2026-01-05', parcelle: 'O', tache: 'Taille', qui: 'Victor', statut: 'Validé' },
      { id: '911', date: '2026-01-05', parcelle: 'O', tache: 'Taille', qui: 'Victor', statut: 'Annulé' },
      { id: '912', date: '2026-01-06', parcelle: 'O', tache: 'Taille', qui: 'Victor', statut: 'Validé' } ] } });
  V = M.tv();
  eq('R9 · Validé, Annulé, Validé : barème une fois (la première est retirée)', (V.taches.find(t => t.nom === 'Taille') || {}).bar, 30);
  // Validée la campagne d'avant (avant le début de la période) : la validation de cette période compte
  M.set({ w: { JOURNAL: [
      { id: '920', date: '2025-06-10', parcelle: 'O', tache: 'Taille', qui: 'Victor', statut: 'Validé' },
      { id: '921', date: '2026-01-06', parcelle: 'O', tache: 'Taille', qui: 'Victor', statut: 'Validé' } ] } });
  V = M.tv();
  eq('R10 · une validation d\'une période passée ne rend pas celle-ci « déjà faite »', (V.taches.find(t => t.nom === 'Taille') || {}).bar, 30);
  M.set({ t: {} });

  // ── P : PAR-1 — la journée du domaine, au prorata du barème ─────────────
  // P1-P3 : Nico valide deux parcelles pour l'équipe sans la cocher (le cas du tableau Parcelles).
  M.set({ w: { PARCELLES: [P('P', 1), P('Q', 0.5)], TACHES, MEMBRES: [{ nom: 'Nico' }, { nom: 'Victor' }, { nom: 'Shana' }], CAVE_ELEVAGE: { operations: [] },
    JOURNAL: ['P', 'Q'].map((p, i) => ({ id: (0xa00 + i).toString(16), date: '2026-01-06', parcelle: p, tache: 'Taille', qui: 'Nico', statut: 'Validé' })) },
    h: { Nico: jours(['2026-01-06'], 2), Victor: jours(['2026-01-05', '2026-01-06'], 8), Shana: jours(['2026-01-06'], 8) }, c: {}, t: {} });
  V = M.tv();
  eq('P1 · équipe non cochée : 2 + 16 + 8 = 26 h, 1 ha sur 1,5 → P reçoit 26 × 2/3', hp(V, 'P', 'Taille'), 26 * 2 / 3);
  eq('P2 · … et Q le tiers', hp(V, 'Q', 'Taille'), 26 / 3);
  eq('P3 · rien en attente : la veille de Victor rejoint la journée validée', V.hAtt, 0);
  // P4 : travaux mêlés le même jour — le barème, pas la surface
  M.set({ w: { PARCELLES: [P('R', 1), P('S', 1)], MEMBRES: [{ nom: 'Victor' }],
    JOURNAL: [ { id: 'b00', date: '2026-01-05', parcelle: 'R', tache: 'Taille', qui: 'Victor', statut: 'Validé' },
               { id: 'b01', date: '2026-01-05', parcelle: 'S', tache: 'Relevage', qui: 'Victor', statut: 'En cours', niveaux: [1] } ] },
    h: { Victor: jours(['2026-01-05'], 8) } });
  V = M.tv();
  eq('P4 · taille 1 ha (15) et relevage niveau 1, 1 ha (25) : 8 h × 15/40 = 3 h sur R', hp(V, 'R', 'Taille'), 3);
  eq('P5 · … et 5 h sur S', hp(V, 'S', 'Relevage'), 5);
  // P6 : deux équipes nommées le même jour — chacune garde ses parcelles (règle du groupe)
  M.set({ w: { PARCELLES: [P('T', 1), P('U', 1)], MEMBRES: [{ nom: 'Victor' }, { nom: 'Shana' }, { nom: 'Alicia' }],
    JOURNAL: [ { id: 'c00', date: '2026-01-05', parcelle: 'T', tache: 'Taille', qui: 'Victor', statut: 'Validé', membresEquipe: ['Shana'] },
               { id: 'c01', date: '2026-01-05', parcelle: 'U', tache: 'Taille', qui: 'Alicia', statut: 'Validé' } ] },
    h: { Victor: jours(['2026-01-05'], 8), Shana: jours(['2026-01-05'], 8), Alicia: jours(['2026-01-05'], 8) } });
  V = M.tv();
  eq('P6 · équipe Victor + Shana : 16 h sur T', hp(V, 'T', 'Taille'), 16);
  eq('P7 · Alicia seule : 8 h sur U', hp(V, 'U', 'Taille'), 8);
  // P8 : une revalidation le même jour qu'une vraie clôture ne prend rien
  M.set({ w: { PARCELLES: [P('W', 1), P('X', 1)], MEMBRES: [{ nom: 'Victor' }],
    JOURNAL: [ { id: 'd00', date: '2026-01-05', parcelle: 'W', tache: 'Taille', qui: 'Victor', statut: 'Validé' },
               { id: 'd01', date: '2026-01-06', parcelle: 'W', tache: 'Taille', qui: 'Victor', statut: 'Validé' },
               { id: 'd02', date: '2026-01-06', parcelle: 'X', tache: 'Taille', qui: 'Victor', statut: 'Validé' } ] },
    h: { Victor: jours(['2026-01-05', '2026-01-06'], 8) } });
  V = M.tv();
  eq('P8 · la revalidation de W le 6 ne prend rien : les 8 h du 6 vont à X', hp(V, 'X', 'Taille'), 8);
  eq('P9 · W garde les 8 h du 5', hp(V, 'W', 'Taille'), 8);
  eq('P10 · INVARIANT : versé + attente = rangs − conduite', V.hAff + V.hAtt, V.hChamp - V.hTrac);

  // ── Q : ÉQUIPES-1 — les équipes du jour ────────────────────────────────
  // Q1-Q2 : Victor + Shana valident T le 5 ; Alicia, seule dans son équipe, finit U le 6.
  M.set({ w: { PARCELLES: [P('T', 1), P('U', 2)], TACHES, MEMBRES: [{ nom: 'Victor' }, { nom: 'Shana' }, { nom: 'Alicia' }],
    JOURNAL: [ { id: 'e00', date: '2026-01-05', parcelle: 'T', tache: 'Taille', qui: 'Victor', statut: 'Validé', membresEquipe: ['Shana'] },
               { id: 'e01', date: '2026-01-06', parcelle: 'U', tache: 'Taille', qui: 'Alicia', statut: 'Validé' } ] },
    h: { Victor: jours(['2026-01-05'], 8), Shana: jours(['2026-01-05'], 8), Alicia: jours(['2026-01-05', '2026-01-06'], 8) },
    eq: { '2026-01-05': [['Victor', 'Shana'], ['Alicia']], '2026-01-06': [['Alicia']] } });
  V = M.tv();
  eq('Q1 · jour d\'équipes : Alicia ne rejoint pas T — 16 h sur T', hp(V, 'T', 'Taille'), 16);
  eq('Q2 · … ses deux jours vont à SA parcelle : 16 h sur U', hp(V, 'U', 'Taille'), 16);
  // Q3 : validation sans groupe (hors réseau) un jour d'équipes : l'équipe du jour de l'auteur
  M.set({ w: { PARCELLES: [P('V', 1)], JOURNAL: [ { id: 'e10', date: '2026-01-05', parcelle: 'V', tache: 'Taille', qui: 'Victor', statut: 'Validé', membresEquipe: [] } ] },
    h: { Victor: jours(['2026-01-05'], 8), Shana: jours(['2026-01-05'], 8), Alicia: {} }, eq: { '2026-01-05': [['Victor', 'Shana'], ['Alicia']] } });
  V = M.tv();
  eq('Q3 · sans groupe écrit, Shana vient de l\'équipe du jour : 16 h sur V', hp(V, 'V', 'Taille'), 16);
  // Q4-Q5 : un groupe écrit l'emporte (l'admin a mis Alicia avec Victor)
  M.set({ w: { JOURNAL: [ { id: 'e20', date: '2026-01-05', parcelle: 'V', tache: 'Taille', qui: 'Victor', statut: 'Validé', membresEquipe: ['Alicia'] } ] },
    h: { Victor: jours(['2026-01-05'], 8), Shana: jours(['2026-01-05'], 8), Alicia: jours(['2026-01-05'], 8) } });
  V = M.tv();
  eq('Q4 · groupe écrit Victor + Alicia : 16 h sur V', hp(V, 'V', 'Taille'), 16);
  eq('Q5 · Shana, pas dans le groupe un jour d\'équipes : ses 8 h attendent', V.hAtt, 8);
  M.set({ eq: {} });

  // ── F : période pas encore commencée ───────────────────────────────────
  M.set({ per: { nom: 'Futur', debut: '2099-01-01', fin: '2099-03-01' } });
  V = M.tv();
  ok('F1 · période future : rien, et ok=false (pas de fenêtre à l\'envers)', V.ok === false && V.hAff === 0);
  M.set({ per: { nom: 'Hiver', debut: '2026-01-05', fin: '2026-01-16' } });
  return R;
}

function branchements(src) {
  const R = [], L = nu(src.pil);
  R.push(['G1 · la carte lit _ecoTempsVigne', /_ecoTempsVigne\(\)/.test(extraire(L, '_pecCarteTemps') || '')]);
  R.push(['G2 · la carte est posée dans Postes & travaux', /H\+=_pecCarteTemps\(\);/.test(extraire(L, '_pecViewPostes') || '')]);
  R.push(['G3 · la fiche pil.eco.temps existe', /'pil\.eco\.temps':\s*\{/.test(src.utl)]);
  R.push(['G4 · … et elle est posée sur la carte', /_mvInfoBtn\('pil\.eco\.temps'\)/.test(L)]);
  R.push(['G5 · le cache est oublié à la repeinte', /_ECO_TV=null;/.test(extraire(L, '_pilExoOublier') || '')]);
  R.push(['G6 · _ecoTracHByParc expose la conduite par conducteur et par jour', /out\.condH\[se\.conducteur\]\[_cd\]/.test(extraire(L, '_ecoTracHByParc') || '')]);
  R.push(['G7 · le moteur lit les heures DANS LES RANGS, pas le travail effectif',
    /_planChampPersRange\(m,_pexD\(d\),_pexD\(d\)\)/.test(extraire(L, '_ecoTempsVigne') || '') && !/_planWorkPersRange/.test(extraire(L, '_ecoTempsVigne') || '')]);
  // ENG-2 — _pecData, la courbe, les tableaux
  const pd = extraire(L, '_pecData') || '', tl = extraire(L, '_pecTimeline') || '';
  R.push(['J1 · l\'engagé prend la main-d\'œuvre du planning', /var moReel = \(TVe && TVe\.ok\) \? TVe\.eur : T\.moF;/.test(pd)
    && /var engage = moReel \+ T\.tracF \+ T\.gnrF \+ T\.phyF;/.test(pd)]);
  R.push(['J2 · la projection ajoute le reste de TRAVAIL au barème', /projFin = cadAppl \? \(engage \+ resteBar\*\(1\+ecart\)\) : \(engage \+ resteBar\)/.test(pd)]);
  R.push(['J3 · le poste main-d\'œuvre vaut l\'engagé réel (le total des postes = l\'engagé)', /k:'mo',[^\n]*fait:moReel/.test(pd)]);
  R.push(['J4 · la courbe pose la main-d\'œuvre au jour payé', /E\.moSrc==='planning' && E\.tv && E\.tv\.byD/.test(tl)]);
  // RÉAL-1 (§188) : les tableaux Parcelles et Coût par travail lisent le RÉALISÉ payé, avec l'écart au barème du fait.
  R.push(['J5 · le réalisé d\'un travail vient des euros versés, repli au barème sans planning', /t\.reE = tvOk \? \(x \? x\.eur : 0\) : t\.fE;/.test(pd)
    && /t\.ecE = \(tvOk && \(t\.fE>0 \|\| t\.reE>0\)\) \? \(t\.reE - t\.fE\) : null;/.test(pd)]);
  R.push(['J7 · le réalisé d\'une parcelle vient des euros versés à la parcelle', /r\.moRe  = tvOk \? \(q \? q\.eur : 0\) : r\.moF;/.test(pd)
    && /r\.engRe = r\.moRe \+ r\.tracF \+ r\.gnrF \+ r\.phyF;/.test(pd)]);
  const vp = extraire(L, '_pecViewPostes') || '', vpa = extraire(L, '_pecViewParcelles') || '';
  R.push(['J8 · le tableau Coût par travail affiche le réalisé et l\'écart', /_ecoEur\(t\.reE\)/.test(vp) && /_pecEcTd\(t\.ecE, t\.fE\)/.test(vp) && !/_ecoEur\(t\.fE\)/.test(vp)]);
  R.push(['J9 · le tableau Parcelles affiche le réalisé et l\'écart', /_ecoEur\(r\.engRe\)/.test(vpa) && /_pecEcTd\(r\.ecE, r\.moF\)/.test(vpa) && !/_ecoEur\(r\.engage\)/.test(vpa)]);
  R.push(['J10 · les heures en attente sont dites sous le tableau des travaux', /E\.reAttE>=1/.test(vp)]);
  R.push(['J11 · le graphe des travaux dessine le réalisé payé', /var re=\(t\.reE!=null\)\?t\.reE:t\.fE/.test(extraire(L, '_pecTaskSvg') || '')]);
  R.push(['J6 · la fiche pil.eco.engage existe et est posée', /'pil\.eco\.engage':\s*\{/.test(src.utl) && /_mvInfoBtn\('pil\.eco\.engage'\)/.test(L)]);

  // TV-2 — la saisie
  const A = nu(src.app), G = nu(src.reg);
  R.push(['H1 · se décocher est réservé à l\'administrateur', /function _mvMoiAdmin\(\)\{[^\n]*isAdmin\(\)/.test(A)
    && /if\(!_mvMoiAdmin\(\)\) return false;/.test(extraire(A, '_mvQuiHors') || '')]);
  R.push(['H2 · la puce « Moi » n\'a pas de data-nom (jamais ramassée comme membre)', /class="pchk mbr-moi[^`]*data-moi="1"/.test(A) && !/mbr-moi[^`]*data-nom=/.test(A)]);
  const nQH = (A.match(/\.quiHors=true/g) || []).length;
  R.push(['H3 · les cinq chemins d\'écriture posent quiHors (panneau, journal, niveaux, passages, un appui)', nQH === 5, nQH]);
  const nRef = (A.match(/Personne dans le groupe : cochez qui a travaill/g) || []).length;
  R.push(['H4 · un groupe vide sans le validateur est refusé (quatre panneaux)', nRef === 4, nRef]);
  R.push(['H5 · niveaux et passages refusent AVANT toute mutation', /function confirmNiveaux\(\)\{\s*if\(_mvValidBlocked\(\)\)return;\s*var _nivEq=/.test(A)
    && /function confirmPassages\(\)\{\s*if\(_mvValidBlocked\(\)\)return;\s*var _passEq=/.test(A)]);
  R.push(['H6 · les lecteurs du groupe sautent l\'auteur hors des rangs', (L.match(/if\(j\.qui && !j\.quiHors\) noms\.push\(j\.qui\);/g) || []).length === 2
    && /if\(j&&j\.qui&&!j\.quiHors\) L\.push\(j\.qui\);/.test(G)]);
  return R;
}

function executer(src) {
  const C = charger(src);
  if (C.manque) return [['fonctions introuvables : ' + C.manque.join(', '), false]];
  let R;
  try { R = scenarios(C.M); } catch (e) { R = [['exception : ' + e.message, false]]; }
  return R.concat(branchements(src));
}

/* ── Contre-épreuves ───────────────────────────────────────────────────── */
const MUT = [
  ['parts égales au lieu du prorata', 'var part=(Sb>0)?((e.b||0)/Sb):((S>0)?(e.surf/S):(1/L.length))', 'var part=1/L.length'],
  ['PAR-1 : prorata de la surface au lieu du barème', 'var part=(Sb>0)?((e.b||0)/Sb):((S>0)?(e.surf/S):(1/L.length))', 'var part=(S>0)?(e.surf/S):(1/L.length)'],
  ['PAR-1 : un salarié non nommé ne rejoint plus la journée du domaine', 'if(!(L && L.length) && evJour[d] && !eqJour[d] && !(horsJour[d] && horsJour[d][m.nom])) L=evJour[d];', ''],
  ['PAR-1 : le décoché rejoint la journée du domaine', 'if(!(L && L.length) && evJour[d] && !eqJour[d] && !(horsJour[d] && horsJour[d][m.nom])) L=evJour[d];', 'if(!(L && L.length) && evJour[d] && !eqJour[d]) L=evJour[d];'],
  ['ÉQUIPES-1 : un jour d\'équipes garde la journée du domaine', 'if(!(L && L.length) && evJour[d] && !eqJour[d] && !(horsJour[d] && horsJour[d][m.nom])) L=evJour[d];', 'if(!(L && L.length) && evJour[d] && !(horsJour[d] && horsJour[d][m.nom])) L=evJour[d];'],
  ['ÉQUIPES-1 : une validation sans groupe ne prend plus l\'équipe du jour', 'if(EQd && !((j.membresEquipe||[]).length) && j.qui){', 'if(false){'],
  ['PAR-1 : une revalidation prend sa part de la journée', 'e.b = e.dup ? 0 : _ecoTvBar(', 'e.b = _ecoTvBar('],
  ['les heures ne s\'accumulent plus d\'un jour à l\'autre', "if(!(acc>0)) g.dAtt=d; acc+=hv;", "acc=hv;"],
  ['la conduite tracteur n\'est plus retirée', 'var ht=Math.min(h, Number(cd[d])||0);', 'var ht=0;'],
  ['la liste cumulative des niveaux n\'est plus comparée à la précédente', 'var nNiv=niv.filter(function(x){ return P.niv.indexOf(x)<0; });', 'var nNiv=niv.slice();'],
  ['« Annulé » est ignoré', "if(st==='Annul\\u00e9'){", "if(false){"],
  ['la validation vaut pour le seul validateur', "    (j.membresEquipe||[]).forEach(function(n){ if(n && noms.indexOf(n)<0) noms.push(n); });\n    // ★★ ÉQUIPES-1", "    // ★★ ÉQUIPES-1"],
  ['le bareme est compté une fois par personne', 'P.bar+=b; P.n++;', 'P.bar+=b*Object.keys(P.noms).length||b; P.n++;'],
  ['la période future ouvre une fenêtre à l\'envers', "  if(auj<d0) return vide;\n", '\n'],
  ['quiHors ignoré par le moteur', "var noms=[]; if(j.qui && !j.quiHors) noms.push(j.qui);   // TV-2 : le validateur hors des rangs ne compte pas\n    (j.membresEquipe||[]).forEach(function(n){ if(n && noms.indexOf(n)<0) noms.push(n); });\n    // ★★ ÉQUIPES-1", "var noms=[]; if(j.qui) noms.push(j.qui);\n    (j.membresEquipe||[]).forEach(function(n){ if(n && noms.indexOf(n)<0) noms.push(n); });\n    // ★★ ÉQUIPES-1"],
  ['ENG-2 : operateur compte comme intervenant', "(Array.isArray(op.intervenants)?op.intervenants:[]).forEach(", "(Array.isArray(op.intervenants)&&op.intervenants.length?op.intervenants:[op.operateur]).forEach("],
  ['ENG-2 : les analyses vident une journée', "if(!op || op.type==='analyse' || !op.date) return;", "if(!op || !op.date) return;"],
  ['ENG-2 : les journées de cave ne sortent plus', "if(hv>0 && cj[d]){ g.hCave+=hv; hv=0; }", ""],
  ['ENG-2 : taux fixe au lieu du taux du jour', "Number(window._mvPaieTauxEffAt(m,d))||0", "Number(window._mvPaieTauxEffAt(m,d0))||0"],
  ['ENG-2 : l\'engagé revient au barème des validations', "var engage = moReel + T.tracF + T.gnrF + T.phyF;", "var engage = T.moF + T.tracF + T.gnrF + T.phyF;"],
  ['ENG-2 : la courbe ignore le planning', "if(E.moSrc==='planning' && E.tv && E.tv.byD){", "if(false){"],
  ['tout le monde peut se décocher (plus de garde administrateur)', "  if(!_mvMoiAdmin()) return false;\n  var el=document.querySelector", "  var el=document.querySelector", 'app'],
  ['niveaux : le refus du groupe vide vient APRÈS la mutation', "  var _nivEq=document.getElementById('niv-equipe-val')", "  ;var _nivEq=document.getElementById('niv-equipe-val')", 'app'],
  ['le journal (Réglages) compte l\'auteur hors des rangs', "if(j&&j.qui&&!j.quiHors) L.push(j.qui);", "if(j&&j.qui) L.push(j.qui);", 'reg'],
  ['RÉAL-1 : les euros ne suivent plus les heures', 'P.eur+=accE*part;', 'P.eur+=0;'],
  ['RÉAL-1 : une revalidation recompte le barème', 'var b=e.dup ? 0 : _ecoTvBar(', 'var b=_ecoTvBar('],
  ['RÉAL-1 : la revalidation n\'est plus bornée à la période', "if(clot && dt>=d0 && st==='Valid\\u00e9'", "if(clot && st==='Valid\\u00e9'"],
  ['RÉAL-1 : le réalisé du tableau revient au barème du fait', 't.reE = tvOk ? (x ? x.eur : 0) : t.fE;', 't.reE = t.fE;'],
  ['RÉAL-1 : le tableau Parcelles revient au barème', "+'<td class=\"r\">'+_pilEsc(_ecoEur(r.engRe))+'</td>'", "+'<td class=\"r\">'+_pilEsc(_ecoEur(r.engage))+'</td>'"],
  ['la liste des passages est remplacée au lieu d\'être réunie', 'niv:P.niv.concat(nNiv), pass:P.pass.concat(nPass) };', 'niv:niv.length?niv:P.niv, pass:pass.length?pass:P.pass };'],
];

let rouge = 0;
console.log('\n══ HARNAIS TEMPS VIGNE (TV-1) ══\n');
const R0 = executer(BASE);
for (const [n, v] of R0) { console.log((v ? '  \x1b[32m✓\x1b[0m ' : '  \x1b[31m✗\x1b[0m ') + n); if (!v) rouge++; }

if (CONTRE) {
  console.log('\n── CONTRE-ÉPREUVES (chaque défaut doit faire rougir) ──\n');
  for (const [nom, de, vers, cle] of MUT) {
    if (BASE[cle || 'pil'].split(de).length !== 2) { console.log('  \x1b[31m✗\x1b[0m ERREUR D\'INJECTION : ancre introuvable ou multiple — ' + nom); rouge++; continue; }
    const R = executer({ ...BASE, [cle || 'pil']: BASE[cle || 'pil'].replace(de, vers) });
    const n = R.filter(r => !r[1]).length;
    if (n > 0) console.log('  \x1b[32m✓\x1b[0m DÉTECTÉ  ' + nom + ' (' + n + ' rouge' + (n > 1 ? 's' : '') + ')');
    else { console.log('  \x1b[31m✗\x1b[0m RESTE VERT  ' + nom); rouge++; }
  }
}
console.log('\n' + (rouge ? '\x1b[31mROUGE\x1b[0m — ' + rouge + ' échec(s)' : '\x1b[32mVERT\x1b[0m') + '  —  ' + R0.length + ' assertions' + (CONTRE ? ', ' + MUT.length + ' contre-épreuves' : '') + '\n');
process.exit(rouge ? 1 : 0);
