#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════════
   MA VIGNE — HARNAIS DU RETARD  (méthode C20 : les VRAIES fonctions extraites
   de src/planning.js, jamais une réécriture. Une réécriture prouve que MA copie
   marche, pas que le module marche.)

   Ce qu'il tient :
     A. l'arithmétique          — _planRetardH / _planRetardFaites / _planRetardVide
     B. le décompte des heures  — _planDayH, réglage des dues POSÉ **et** ABSENT
     C. les heures dues         — _planAbsLostH, dans les deux modes
     D. l'écriture              — _planApplyAbs : motif_t, motif_h, bascule
     E. la case                 — _pl2Cell : orange + heures faites, pas une croix
     F. le non-régressif        — les autres motifs ne bougent pas hors fenêtre

   ⚠️ CHEMINS : jamais new URL(...).pathname — sous Windows il rend /C:/Users/…
      que Node repart en C:\C:\Users\…. Le bac à sable est Linux, la machine de
      Nico est Windows : aucun essai ici ne peut attraper ça. fileURLToPath, et
      rien d'autre. (Panne vécue le 20/08.)
   ══════════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI  = path.dirname(fileURLToPath(import.meta.url));
const RAC  = path.resolve(ICI, '..');
const SRC  = path.join(RAC, 'src', 'planning.js');

let rouge = 0, vert = 0;
const ECHECS = [];

function ok(nom, cond, detail) {
  if (cond) { vert++; return true; }
  rouge++; ECHECS.push(nom + (detail ? '  — ' + detail : ''));
  return false;
}
function eq(nom, obtenu, attendu, tol = 0.0001) {
  const bon = (typeof attendu === 'number')
    ? Math.abs(obtenu - attendu) <= tol
    : obtenu === attendu;
  return ok(nom, bon, bon ? '' : 'obtenu ' + JSON.stringify(obtenu) + ', attendu ' + JSON.stringify(attendu));
}

/* ── EXTRACTION ────────────────────────────────────────────────────────────
   On découpe les fonctions par leur en-tête et on compte les accolades. Si une
   fonction attendue manque, le harnais est ROUGE : une fonction renommée ou
   supprimée doit se voir ici, pas en production. */
const source = fs.readFileSync(SRC, 'utf8');

function extraire(nom) {
  const tete = 'function ' + nom + '(';
  const i = source.indexOf(tete);
  if (i < 0) return null;
  let j = source.indexOf('{', i), prof = 0, k = j;
  for (; k < source.length; k++) {
    const c = source[k];
    if (c === '{') prof++;
    else if (c === '}') { prof--; if (prof === 0) { k++; break; } }
  }
  return source.slice(i, k);
}

const VOULUES = [
  '_planMinOf', '_planAbsT', '_planAbsH', '_planAbsDef', '_planAbsMotif',
  '_planTimingH', '_planRetardFaites', '_planRetardH', '_planRetardVide',
  '_planDayH', '_planWorkH', '_planAbsLostH', '_planApplyAbs', '_pl2Cell',
  '_planDefTiming', '_planRetardBornes', '_planPlanned', '_planFmt', '_planDays'
];

const morceaux = [];
for (const n of VOULUES) {
  const f = extraire(n);
  if (!f) { rouge++; ECHECS.push('EXTRACTION : ' + n + ' introuvable dans src/planning.js'); }
  else morceaux.push(f);
}

/* Les tables, extraites telles quelles. Les RÉÉCRIRE ici ferait passer le harnais
   sur MES valeurs et non sur celles du module — le contraire de ce qu'il teste. */
function table(decl, fin) {
  const i = source.indexOf(decl);
  if (i < 0) return null;
  const j = source.indexOf(fin, i);
  return j < 0 ? null : source.slice(i, j + fin.length);
}
const tableMotifs = table('var PLAN_ABS_MOTIFS=[', '];');
const tableDefT   = table('var PLAN_DEF_T = {', '};');
if (!tableMotifs) { rouge++; ECHECS.push('EXTRACTION : PLAN_ABS_MOTIFS introuvable'); }
if (!tableDefT)   { rouge++; ECHECS.push('EXTRACTION : PLAN_DEF_T introuvable'); }

if (rouge > 0) {
  console.log('\n  HARNAIS DU RETARD — extraction impossible\n');
  ECHECS.forEach(e => console.log('  ✗ ' + e));
  process.exit(1);
}

/* ── STUBS MINIMAUX ───────────────────────────────────────────────────────
   Le strict nécessaire pour que les fonctions extraites tournent. Tout stub
   qui ferait un CALCUL métier serait une réécriture déguisée : ils ne font
   que rendre des données. */
const PRELUDE = `
var PLAN_PAUSE_MIN = 60;
var planMonth = 7, planYear = 2026;
var PLANNING_TEMPLATES = {}, PLANNING_ENTRIES = {};
var _planCtxYear = null;
var CONFIG_DUES = '';                       // pilote _planDuesActive
var TPL = {};                                // {mois:{jour:heures}}
var ENT = {};                                // {nom:{mois:{jour:entree}}}
var CONTRAT = true;

function _pY(){ return planYear; }
function _planDuesActive(m){
  if(!CONFIG_DUES) return false;
  return (_pY()+'-'+String(m+1).padStart(2,'0')) >= CONFIG_DUES;
}
function _planPlId(m){ return (m&&m.planning_id)||'A'; }   // même forme que le module
function _planGetTpl(){ return TPL; }
function _pEntDay(nom,m,d){ return ((ENT[nom]||{})[m]||{})[d]; }
function _pEntMonth(nom,m){ return (ENT[nom]||{})[m] || {}; }
function _pEntYear(nom){ return ENT[nom] || {}; }
function _pEntEnsure(nom,m){ ENT[nom]=ENT[nom]||{}; ENT[nom][m]=ENT[nom][m]||{}; return ENT[nom][m]; }
function _planInContract(){ return CONTRAT; }
function _planInContractRead(){ return CONTRAT; }
function _planSelParse(k){ var i=k.lastIndexOf('|'); return {nom:k.slice(0,i), d:parseInt(k.slice(i+1),10)}; }
function _planEffective(plId,m,d,e){ return _planDayH(plId,m,d,e); }
function _planFerie(){ return null; }
function _planDow(m,d){ return new Date(_pY(),m,d).getDay(); }
function _planLegal(){ return {maxJour:10}; }
function _planEffN(){ return 1; }
var window = { MEMBRES: [{nom:'Jean'}] };
`;

const CODE = PRELUDE + '\n' + tableDefT + '\n' + tableMotifs + '\n' + morceaux.join('\n') + `
;return {
  _planMinOf:_planMinOf, _planAbsT:_planAbsT, _planAbsH:_planAbsH,
  _planRetardFaites:_planRetardFaites, _planRetardH:_planRetardH,
  _planRetardVide:_planRetardVide, _planRetardBornes:_planRetardBornes,
  _planTimingH:_planTimingH, _planDayH:_planDayH, _planWorkH:_planWorkH,
  _planAbsLostH:_planAbsLostH, _planApplyAbs:_planApplyAbs, _pl2Cell:_pl2Cell,
  _planAbsMotif:_planAbsMotif, _planDefTiming:_planDefTiming,
  set:function(o){
    if(o.tpl){ TPL=o.tpl; PLANNING_TEMPLATES[planYear]={A:TPL}; }
    if(o.debut!==undefined){
      // ★ _planDefTiming lit PLANNING_TEMPLATES DIRECTEMENT, pas _planGetTpl.
      //   Poser _timings ici, c'est emprunter le vrai chemin du module : celui
      //   qui calcule fin = debut + heures + coupure.
      TPL._timings = o.debut ? { 7:{ d:o.debut } } : undefined;
      if(!o.debut) delete TPL._timings;
      PLANNING_TEMPLATES[planYear]={A:TPL};
    }
    if(o.ent)ENT=o.ent; if(o.dues!==undefined)CONFIG_DUES=o.dues;
    if(o.mois!==undefined)planMonth=o.mois; if(o.contrat!==undefined)CONTRAT=o.contrat; },
  ent:function(){ return ENT; }
};`;

let M;
try { M = new Function(CODE)(); }
catch (err) {
  console.log('\n  HARNAIS DU RETARD — le code extrait ne s\'exécute pas');
  console.log('  ' + err.message + '\n');
  process.exit(1);          // ★ un plantage COMPTE COMME ROUGE, jamais comme un succès
}

/* Journée type : 7 h prévues, départ 08:00 posé dans le template → fin 16:00
   (7 h + 60 min de coupure). `debut:''` retire les _timings et fait retomber le
   module sur PLAN_DEF_T — c'est le SECOND chemin, testé en A16/A17. */
function poser(dues, debut) {
  const tpl = { 7: { 12: 7, 13: 7, 14: 7 } };
  M.set({ tpl: tpl, debut: debut === undefined ? '08:00' : debut,
          ent: { Jean: { 7: {} } }, dues: dues === undefined ? '' : dues,
          mois: 7, contrat: true });
}

/* ★★★ TOUTE LA CAMPAGNE DANS UN try : une exception au milieu des assertions
   sortirait sinon en silence avec un code 1 mais SANS dire laquelle a planté —
   et pire, un `catch` mal placé la ferait passer pour un succès. Un plantage
   est un ROUGE, nommé. */
function campagne() {

/* ══ A · L'ARITHMÉTIQUE ═══════════════════════════════════════════════════ */
poser();
eq('A1 · fin prévue calculée', (function () { const t = M._planDefTiming(7, 'A', 7, 12); return (t.f || t.fin); })(), '16:00');
eq('A2 · arrivée 09:30 → 1,5 h dues', M._planRetardH('08:00', '16:00', '09:30', 7, false), 1.5);
eq('A3 · arrivée 09:30 → 5,5 h faites', M._planRetardFaites('16:00', '09:30', 7, false), 5.5);
eq('A4 · à l\'heure → 0 h due', M._planRetardH('08:00', '16:00', '08:00', 7, false), 0);
eq('A5 · en avance → 0 h due', M._planRetardH('08:00', '16:00', '07:15', 7, false), 0);
// ★ LA COUPURE. Arriver à 14 h ne doit PAS l'heure du repas : 14:00→16:00 = 2 h faites,
//   donc 5 h dues et non 6. C'est tout l'intérêt de passer par _planTimingH.
eq('A6 · arrivée 14:00 → 5 h dues, pas 6', M._planRetardH('08:00', '16:00', '14:00', 7, false), 5);
eq('A7 · borne haute : jamais plus que la journée', M._planRetardH('08:00', '16:00', '15:59', 7, false) <= 7, true);
eq('A8 · arrivée = fin prévue → plus un retard', M._planRetardVide('16:00', '16:00'), true);
eq('A9 · arrivée après la fin → plus un retard', M._planRetardVide('16:00', '17:30'), true);
eq('A10 · arrivée avant la fin → reste un retard', M._planRetardVide('16:00', '15:00'), false);
eq('A11 · heure malformée rejetée', M._planMinOf('25:00'), -1);
eq('A12 · heure vide rejetée', M._planMinOf(''), -1);
eq('A13 · heure valide lue', M._planMinOf('09:05'), 545);
eq('A14 · motif_t invalide ignoré', M._planAbsT({ motif_t: 'nawak' }), '');
eq('A15 · motif_t valide lu', M._planAbsT({ motif_t: '09:30' }), '09:30');

// ★ SECOND CHEMIN : sans _timings, le module retombe sur PLAN_DEF_T, où une
//   journée de 7 h va de 07:00 à 15:00 — et NON de 08:00 à 16:00, ce que j'avais
//   supposé au premier jet. Les bornes ne se devinent pas, elles se lisent.
poser('', '');
eq('A16 · sans _timings : bornes du fallback',
   (function () { const t = M._planDefTiming(7, 'A', 7, 12); return (t.d || t.debut) + '→' + (t.f || t.fin); })(),
   '07:00→15:00');
eq('A17 · _planRetardBornes suit le même chemin',
   (function () { const b = M._planRetardBornes({ nom: 'Jean' }, 7, 12); return b.t0 + '→' + b.t1; })(),
   '07:00→15:00');
poser();   // retour au scénario 08:00 → 16:00

/* ══ B · LE DÉCOMPTE — RÉGLAGE ABSENT (le défaut signalé) ═════════════════ */
poser('');   // « Absences qui doivent des heures » : Inactif, son état par défaut
const retard = { absent: true, motif: 'retard', motif_t: '09:30', motif_h: 1.5 };
eq('B1 · ★ réglage ABSENT : la journée compte 5,5 h, pas 0',
   M._planDayH('A', 7, 12, retard), 5.5);
eq('B2 · ★ réglage ABSENT : travail effectif = 5,5 h',
   M._planWorkH('A', 7, 12, retard), 5.5);
eq('B3 · une absence injustifiée reste à 0 h hors fenêtre',
   M._planDayH('A', 7, 12, { absent: true, motif: 'injustifie' }), 0);
eq('B4 · un arrêt de travail reste à 0 h hors fenêtre',
   M._planDayH('A', 7, 12, { absent: true, motif: 'arret' }), 0);
eq('B5 · une formation compte 7 h (assimilée), inchangé',
   M._planDayH('A', 7, 12, { absent: true, motif: 'formation' }), 7);

/* ══ B bis · RÉGLAGE POSÉ — rien ne doit changer pour le retard ══════════ */
poser('2026-01');
eq('B6 · réglage POSÉ : même résultat, 5,5 h', M._planDayH('A', 7, 12, retard), 5.5);
eq('B7 · réglage POSÉ : injustifiée toujours 0 h',
   M._planDayH('A', 7, 12, { absent: true, motif: 'injustifie' }), 0);

/* ══ C · LES HEURES DUES ══════════════════════════════════════════════════ */
poser('');
M.set({ ent: { Jean: { 7: { 12: retard } } } });
const mbr = { nom: 'Jean' };
eq('C1 · ★ réglage ABSENT : 1,5 h dues', M._planAbsLostH(mbr, 7, true), 1.5);
eq('C2 · ★ réglage ABSENT : 1,5 h neutralisées dans la référence',
   M._planAbsLostH(mbr, 7, false), 1.5);

poser('');
M.set({ ent: { Jean: { 7: { 12: { absent: true, motif: 'injustifie' } } } } });
eq('C3 · injustifiée hors fenêtre : toujours 0 h due (non-régression)',
   M._planAbsLostH(mbr, 7, true), 0);
eq('C4 · injustifiée hors fenêtre : toujours 0 h neutralisée',
   M._planAbsLostH(mbr, 7, false), 0);

poser('2026-01');
M.set({ ent: { Jean: { 7: { 12: { absent: true, motif: 'injustifie' } } } } });
eq('C5 · injustifiée DANS la fenêtre : 7 h dues (non-régression)',
   M._planAbsLostH(mbr, 7, true), 7);

poser('2026-01');
M.set({ ent: { Jean: { 7: { 12: { absent: true, motif: 'arret' } } } } });
eq('C6 · arrêt dans la fenêtre : neutre, 0 h due',
   M._planAbsLostH(mbr, 7, true), 0);
eq('C7 · arrêt dans la fenêtre : 7 h neutralisées',
   M._planAbsLostH(mbr, 7, false), 7);

/* ══ D · L'ÉCRITURE ═══════════════════════════════════════════════════════ */
poser('');
let r = M._planApplyAbs(['Jean|12'], 'retard', 'panne', null, '09:30');
let e12 = M.ent().Jean[7][12];
eq('D1 · un jour écrit', r.n, 1);
eq('D2 · motif_t enregistré', e12.motif_t, '09:30');
eq('D3 · motif_h calculé, pas saisi', e12.motif_h, 1.5);
eq('D4 · motif = retard', e12.motif, 'retard');
eq('D5 · aucune bascule', r.basc, 0);

poser('');
r = M._planApplyAbs(['Jean|12'], 'retard', '', null, '17:00');
e12 = M.ent().Jean[7][12];
eq('D6 · ★ arrivée après la fin → bascule en injustifiée', e12.motif, 'injustifie');
eq('D7 · la bascule est comptée', r.basc, 1);
eq('D8 · pas de motif_t sur une injustifiée', e12.motif_t, undefined);

poser('');
r = M._planApplyAbs(['Jean|12'], 'retard', '', null, '08:00');
eq('D9 · ★ à l\'heure → aucune absence écrite', r.n, 0);
eq('D10 · le jour reste vierge', M.ent().Jean[7][12], undefined);

// Repli : sans heure d'arrivée, l'ancien chemin (heures saisies) marche encore.
poser('');
r = M._planApplyAbs(['Jean|12'], 'retard', '', 2, null);
eq('D11 · repli sans motif_t : motif_h saisi conservé', M.ent().Jean[7][12].motif_h, 2);
eq('D12 · repli : aucun motif_t inventé', M.ent().Jean[7][12].motif_t, undefined);

/* ══ E · LA CASE ══════════════════════════════════════════════════════════ */
poser('');
M.set({ ent: { Jean: { 7: { 12: retard, 13: { absent: true, motif: 'injustifie' } } } } });
const cR = M._pl2Cell(mbr, 'A', 12, { maxJour: 10 });
const cA = M._pl2Cell(mbr, 'A', 13, { maxJour: 10 });
eq('E1 · ★ le retard ne rend PAS une croix', cR.txt === '\u2715', false);
// ⚠️ Écrite d'abord `attendu = (… === 5.5) ? '5h30' : cR.txt`, elle NE POUVAIT PAS
//    échouer : la branche par défaut valait la valeur observée. Le défaut de §48,
//    reproduit. La valeur attendue est en dur, et rien d'autre.
eq('E2 · la case porte les heures faites', cR.txt, '5h30');
eq('E3 · classe orange dédiée', cR.cls, 'pl2c-late');
eq('E4 · une vraie absence garde la croix', cA.txt, '\u2715');
eq('E5 · une vraie absence garde sa classe', cA.cls, 'pl2c-abs');

// Un retard qui couvre toute la journée retombe sur la croix : il n'y a rien à montrer.
poser('');
M.set({ ent: { Jean: { 7: { 12: { absent: true, motif: 'retard', motif_h: 7 } } } } });
eq('E6 · retard couvrant la journée → croix', M._pl2Cell(mbr, 'A', 12, { maxJour: 10 }).cls, 'pl2c-abs');

/* ══ G · L'ÉCRAN ET LE MOTEUR LISENT LA MÊME HEURE ═══════════════════════
   ★ LE DÉFAUT VÉCU (20/08) : _planRetardBornes n'interrogeait que _planDefTiming.
     Quand le jour portait son propre horaire (ent.timing), l'écran affichait un
     départ et le moteur en comparait un autre — une arrivée réellement en retard
     ressortait « à l'heure, aucune absence enregistrée ». Le harnais ne pouvait
     pas le voir : son stub _planPlId ignorait le membre et aucun cas ne posait
     d'horaire de jour. */
poser();
// Jour démarré à 06:00, 7 h nettes (06:00→14:00 avec la coupure) — alors que le
// DÉFAUT du planning dit 08:00→16:00. C'est le cas exact du bug : l'écran montrait
// 06:00, le moteur comparait à 08:00, et 07:00 ressortait « à l'heure ».
M.set({ ent: { Jean: { 7: { 12: { timing: { debut: '06:00', fin: '14:00' } } } } } });
eq('G1 · les bornes suivent l\'horaire DU JOUR, pas le défaut',
   (function () { const b = M._planRetardBornes(mbr, 7, 12); return b.t0 + '→' + b.t1; })(),
   '06:00→14:00');
eq('G1b · le défaut du planning dit autre chose (sinon le cas ne prouve rien)',
   (function () { const t = M._planDefTiming(7, 'A', 7, 12); return (t.d) + '→' + (t.f); })(),
   '08:00→16:00');
eq('G2 · ★ arrivée 07:00 sur un jour qui démarre à 06:00 = un retard, pas « à l\'heure »',
   (function () { const r2 = M._planApplyAbs(['Jean|12'], 'retard', '', null, '07:00'); return r2.n; })(), 1);

poser();
M.set({ ent: { Jean: { 7: { 12: { timing: { debut: '10:00', fin: '18:00' } } } } } });
eq('G3 · arrivée 09:00 sur un jour qui démarre à 10:00 : en avance',
   (function () { const r3 = M._planApplyAbs(['Jean|12'], 'retard', '', null, '09:00'); return r3.alheure; })(), 1);

/* ══ H · LE MESSAGE NE MENT PAS SUR LA CAUSE ═════════════════════════════
   Trois raisons de n'écrire aucun jour, trois compteurs. Les confondre faisait
   annoncer « arrivée à l'heure » sur un jour hors contrat ou non planifié. */
poser();
M.set({ tpl: { 7: {} }, ent: { Jean: { 7: {} } } });     // aucune heure prévue
let rH = M._planApplyAbs(['Jean|12'], 'retard', '', null, '09:30');
eq('H1 · jour sans planning : compté à part', rH.sansplan, 1);
eq('H2 · jour sans planning : pas compté « à l\'heure »', rH.alheure, 0);
eq('H3 · jour sans planning : rien écrit', rH.n, 0);

poser();
M.set({ contrat: false });
rH = M._planApplyAbs(['Jean|12'], 'retard', '', null, '09:30');
eq('H4 · hors contrat : compté dans skip', rH.skip, 1);
eq('H5 · hors contrat : pas compté « à l\'heure »', rH.alheure, 0);

poser();
rH = M._planApplyAbs(['Jean|12'], 'retard', '', null, '08:00');
eq('H6 · vraiment à l\'heure : le bon compteur', rH.alheure, 1);
eq('H7 · vraiment à l\'heure : sansplan reste vide', rH.sansplan, 0);

/* ══ F · ENTRÉES ANTÉRIEURES AU LOT ══════════════════════════════════════ */
poser('');
const vieux = { absent: true, motif: 'retard', motif_h: 2 };   // pas de motif_t
eq('F1 · ancien retard : ses heures sont lues', M._planDayH('A', 7, 12, vieux), 5);
eq('F2 · ancien retard : pas d\'heure d\'arrivée inventée', M._planAbsT(vieux), '');
M.set({ ent: { Jean: { 7: { 12: vieux } } } });
eq('F3 · ancien retard : 2 h dues', M._planAbsLostH(mbr, 7, true), 2);

}   // fin campagne

try { campagne(); }
catch (err) {
  rouge++;
  ECHECS.push('PLANTAGE en cours de campagne — ' + (err && err.message)
    + (err && err.stack ? ' | ' + String(err.stack).split('\n')[1].trim() : ''));
}

/* ══ SORTIE ═══════════════════════════════════════════════════════════════ */
console.log('');
console.log('  MA VIGNE — Harnais du retard');
console.log('  ' + '─'.repeat(58));
if (rouge === 0) {
  console.log('  ✓ ' + vert + ' assertions vertes.');
  console.log('');
  process.exit(0);
}
console.log('  ✗ ' + rouge + ' ROUGE(S) sur ' + (rouge + vert) + ' :');
ECHECS.forEach(e => console.log('    · ' + e));
console.log('');
process.exit(1);
