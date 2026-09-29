#!/usr/bin/env node
/* ───────────────────────────────────────────────────────────────────────────
   MA VIGNE — HARNAIS SCHEMA-1 : LE CONTRÔLE D'UNE JOURNÉE À L'ÉCRITURE
   (méthode C20 : les VRAIES fonctions extraites de src/planning.js, aucune copie)

     A. les cinq formes documentées (§19 « Modèle de données du Planning ») passent
     B. ce qui n'en est pas une est refusé, avec une raison
     C. _pEntPose : refus = rien d'écrit + UNE trace, sans nom ni commentaire
     D. aucun moteur n'écrit une journée en contournant _pEntPose

   Ce que ce harnais NE dit PAS : que les moteurs produisent des journées valides.
   Ça, ce sont les harnais qui jouent les moteurs (retard, recup, semaine, relevé) :
   une journée refusée y devient un jour « ignoré » et leurs assertions rougissent.

     node scripts/mv-harnais-schema-planning.mjs            # contrôle
     node scripts/mv-harnais-schema-planning.mjs --contre   # contre-épreuves
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ICI, '..', 'src', 'planning.js');
const CONTRE = process.argv.includes('--contre');

function extraire(source, nom) {
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
function table(source, decl, fin) {
  const i = source.indexOf(decl);
  if (i < 0) return null;
  const j = source.indexOf(fin, i);
  return j < 0 ? null : source.slice(i, j + fin.length);
}

// Joue tous les contrôles sur un texte source ; rend la liste des échecs.
function jouer(source) {
  const ECHECS = [];
  let verts = 0;
  const ok = (c, m) => { if (c) verts++; else ECHECS.push(m); };

  const fProb = extraire(source, '_planEntreeProbleme');
  const fPose = extraire(source, '_pEntPose');
  const tMot  = table(source, 'var PLAN_ABS_MOTIFS=[', '];');
  if (!fProb || !fPose || !tMot) {
    ECHECS.push('EXTRACTION : ' + [!fProb && '_planEntreeProbleme', !fPose && '_pEntPose', !tMot && 'PLAN_ABS_MOTIFS'].filter(Boolean).join(', '));
    return { verts, ECHECS };
  }
  const PRELUDE = `
var planYear=2026,_planCtxYear=null,ENT={},TRACES=[];
function _pY(){ return _planCtxYear!=null?_planCtxYear:planYear; }
function _pEntEnsure(nom,m){ ENT[nom]=ENT[nom]||{}; ENT[nom][m]=ENT[nom][m]||{}; return ENT[nom][m]; }
var window={ logError:function(o){ TRACES.push(o); } };
`;
  let M;
  try {
    M = new Function(PRELUDE + tMot + '\n' + fProb + '\n' + fPose +
      '\n;return {P:_planEntreeProbleme, pose:_pEntPose, ent:function(){return ENT;}, traces:function(){return TRACES;}};')();
  } catch (e) {
    ECHECS.push('CHARGEMENT : ' + e.message);
    return { verts, ECHECS };
  }
  const P = (e) => { try { return M.P(e); } catch (x) { return 'PLANTAGE ' + x.message; } };

  // ── A. Ce qui DOIT passer : les formes que les moteurs écrivent réellement ──
  const VALIDES = [
    ['heures',            { timing: { debut: '07:00', fin: '16:30', continu: false }, comment: '' }],
    ['heures réduites',   { timing: { debut: '08:00', fin: '12:00', continu: true }, comment: 'rdv', reduit_motif: 'perso' }],
    ['chaleur (barre)',   { timing: { debut: '06:00', fin: '14:00', continu: true }, canicule: true, comment: 'Chaleur' }],
    ['échange',           { timing: { debut: '07:00', fin: '15:00', continu: false }, comment: '', remplacement: true }],
    ['absence',           { absent: true, motif: 'arret', comment: '' }],
    ['retard',            { absent: true, motif: 'retard', comment: '', timing: { debut: '07:00', fin: '16:00', continu: false }, motif_t: '09:30', motif_h: 2.5 }],
    ['absence partielle', { absent: true, motif: 'perso', comment: '', abs_de: '14:00', abs_a: '16:00', motif_h: 2 }],
    ['injustifiée échange', { absent: true, motif: 'injustifie', comment: '', timing: { debut: '07:00', fin: '15:00' }, remplacement: true }],
    ['congé payé',        { type: 'cp', heures: 7 }],
    ['congé payé 0 h',    { type: 'cp', heures: 0 }],
    ['récup',             { type: 'recup' }],
    ['effectif seul',     { effectif: 8 }],
    ['effectif + heures', { timing: { debut: '07:00', fin: '17:00' }, comment: '', effectif: 12 }],
    ['effectif + cp',     { type: 'cp', heures: 7, effectif: 3 }],
    ['heure sur 1 chiffre (ancienne saisie)', { timing: { debut: '7:00', fin: '16:00' }, comment: '' }],
    ['motif de repli',    { absent: true, motif: 'autre', comment: '' }]
  ];
  VALIDES.forEach(([n, e]) => { const r = P(e); ok(r === '', 'A. « ' + n + ' » refusée à tort : ' + r); });

  // ── B. Ce qui DOIT être refusé ──
  const INVALIDES = [
    ['null', null], ['tableau', []], ['chaîne', 'cp'],
    ['type inconnu', { type: 'conge' }],
    ['état d’affichage pris pour un type', { type: 'fer' }],
    ['absence ET congé', { absent: true, type: 'cp', motif: 'arret' }],
    ['absent:false', { absent: false }],
    ['champ inconnu', { timing: { debut: '07:00', fin: '16:00' }, commentaire: 'x' }],
    ['heures sur une journée travaillée', { timing: { debut: '07:00', fin: '16:00' }, heures: 8 }],
    ['motif sans absence', { timing: { debut: '07:00', fin: '16:00' }, motif: 'arret' }],
    ['horaire sans fin', { timing: { debut: '07:00' } }],
    ['horaire hors cadran', { timing: { debut: '25:00', fin: '26:00' } }],
    ['horaire en nombre', { timing: { debut: 7, fin: 16 } }],
    ['continu en texte', { timing: { debut: '07:00', fin: '16:00', continu: 'oui' } }],
    ['motif inconnu', { absent: true, motif: 'vacances' }],
    ['absence sans motif', { absent: true }],
    ['heures manquées négatives', { absent: true, motif: 'retard', motif_h: -1 }],
    ['heure d’arrivée invalide', { absent: true, motif: 'retard', motif_t: '9h30' }],
    ['congé en heures négatives', { type: 'cp', heures: -7 }],
    ['congé en NaN', { type: 'cp', heures: NaN }],
    ['congé en texte', { type: 'cp', heures: '7' }],
    ['récup qui porte des heures', { type: 'recup', heures: 7 }],
    ['effectif nul', { effectif: 0 }], ['effectif décimal', { effectif: 1.5 }], ['effectif > 999', { effectif: 1000 }],
    ['commentaire en nombre', { timing: { debut: '07:00', fin: '16:00' }, comment: 12 }],
    ['motif réduit inconnu', { timing: { debut: '07:00', fin: '12:00' }, reduit_motif: 'sieste' }]
  ];
  INVALIDES.forEach(([n, e]) => { const r = P(e); ok(typeof r === 'string' && r.length > 0 && !r.startsWith('PLANTAGE'), 'B. « ' + n + ' » acceptée à tort' + (r ? ' (' + r + ')' : '')); });

  // ── C. _pEntPose ──
  try {
    const nomTemoin = 'Témoin-Nominatif';
    const refus = M.pose(nomTemoin, 7, 12, { type: 'cp', heures: -1, effectif: 0 });
    ok(refus === false, 'C. un refus doit rendre false');
    ok(!(M.ent()[nomTemoin] && M.ent()[nomTemoin][7] && M.ent()[nomTemoin][7][12]), 'C. un refus ne doit RIEN écrire');
    const tr = M.traces();
    ok(tr.length === 1, 'C. un refus = une trace (vu ' + tr.length + ')');
    if (tr.length) {
      const t = JSON.stringify(tr[0]);
      ok(tr[0].cat === 'planning' && tr[0].level === 'error', 'C. trace en cat planning, niveau error');
      ok(t.indexOf(nomTemoin) < 0, 'C. la trace ne doit porter AUCUN nom de salarié');
      ok(t.indexOf('2026-08-12') >= 0, 'C. la trace doit dater la journée refusée');
    }
    const pose = M.pose(nomTemoin, 7, 13, { type: 'recup' });
    ok(pose === true && M.ent()[nomTemoin][7][13].type === 'recup', 'C. une journée valide doit être écrite');
    ok(M.traces().length === 1, 'C. une écriture valide ne trace rien');
  } catch (e) { ECHECS.push('C. PLANTAGE : ' + e.message); }

  // ── D. Personne ne contourne _pEntPose ──
  // Seules formes tolérées : l'affectation DANS _pEntPose, `delete _pEntEnsure(...)[d]`
  // (effacer n'écrit pas de journée) et `var mo=_pEntEnsure(...)` (simulation restaurée).
  const directs = [];
  const re = /_pEntEnsure\([^)]*\)\s*\[[^\]]+\]\s*=(?!=)/g;
  let m;
  while ((m = re.exec(source))) {
    const avant = source.slice(Math.max(0, m.index - 8), m.index);
    if (/delete\s*$/.test(avant)) continue;
    directs.push(source.slice(0, m.index).split('\n').length);
  }
  const ligneDansPose = (() => { const i = source.indexOf('function _pEntPose('); return i < 0 ? -1 : source.slice(0, i).split('\n').length; })();
  const horsPose = directs.filter(l => !(ligneDansPose > 0 && l > ligneDansPose && l < ligneDansPose + 15));
  ok(horsPose.length === 0, 'D. journée écrite sans passer par _pEntPose, ligne(s) ' + horsPose.join(', '));
  ok(directs.length - horsPose.length === 1, 'D. _pEntPose doit contenir l’unique écriture directe');

  return { verts, ECHECS };
}

const source = fs.readFileSync(SRC, 'utf8');

if (!CONTRE) {
  const { verts, ECHECS } = jouer(source);
  console.log('\n  HARNAIS SCHEMA-1 — la journée contrôlée à l’écriture\n');
  ECHECS.forEach(e => console.log('  ✗ ' + e));
  console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge');
  process.exit(ECHECS.length ? 1 : 0);
}

// ── Contre-épreuves : chaque défaut réintroduit DOIT faire rougir ──
const DEFAUTS = [
  ['le contrôle ne refuse plus rien',
    s => s.replace('function _planEntreeProbleme(e){', "function _planEntreeProbleme(e){ return '';")],
  ['un moteur écrit en contournant _pEntPose',
    s => s.replace('function _planApplySimple(keys,kind,force){', "function _planApplySimple(keys,kind,force){ if(0)_pEntEnsure('x',0)[1]={type:'recup'};")],
  ['le refus écrit quand même',
    s => s.replace('    return false;\n  }\n  _pEntEnsure(nom,m)[d]=e;', '    _pEntEnsure(nom,m)[d]=e; return false;\n  }\n  _pEntEnsure(nom,m)[d]=e;')],
  ['la trace porte le nom',
    s => s.replace("detail:'SCHEMA-1 \\u00b7 '+", "detail:nom+' SCHEMA-1 \\u00b7 '+")]
];
let rates = 0;
console.log('\n  HARNAIS SCHEMA-1 — contre-épreuves\n');
DEFAUTS.forEach(([n, f]) => {
  const muté = f(source);
  if (muté === source) { rates++; console.log('  ✗ défaut « ' + n + ' » : injection impossible (ancre introuvable)'); return; }
  const { ECHECS } = jouer(muté);
  if (ECHECS.length) console.log('  ✓ « ' + n + ' » → ' + ECHECS.length + ' rouge(s)');
  else { rates++; console.log('  ✗ « ' + n + ' » n’est PAS vu par le harnais'); }
});
console.log('\n  ' + (DEFAUTS.length - rates) + '/' + DEFAUTS.length + ' défauts attrapés');
process.exit(rates ? 1 : 0);
