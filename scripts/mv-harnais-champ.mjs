/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — QUI EST DANS LES RANGS CE JOUR-LÀ (lots CHAMP-1 + CHAMP-2, §169)
   Lancer : node scripts/mv-harnais-champ.mjs
            node scripts/mv-harnais-champ.mjs --contre

   ══ POURQUOI ══
   Nico, 23/09/2026 : « dans pilotage, une personne en formation, en arrêt, en cp,
   absente ne doit pas être comptée dans l'effectif du jour pour l'organisation des
   travaux ». La tournée du jour et « Qui fait quoi » (Décider) lisaient la journée
   de chacun dans `_planWorkPersRange`, le TRAVAIL EFFECTIF de la loi : une formation
   ou un événement familial y valent la journée entière (assimilés — juste pour la
   paie et l'annualisation, faux pour savoir qui est à la vigne). Un salarié au CFA
   comptait donc dans l'équipe du jour.

   ══ CE QU'IL TIENT ══
     A. On EXÉCUTE les vraies fonctions extraites de src/planning.js (méthode C20) :
        `_planChampH` jour par jour, et `_planRangeH_` en modes 'champ' et 'work'.
        Congé, récup, arrêt, absence, formation, événement familial : 0 dans les
        rangs ; une absence partielle, formation comprise, n'ampute que ses heures.
        ET le travail effectif NE BOUGE PAS : la formation y vaut toujours la journée.
        CHAMP-2 (« on la passe sur la même lecture ») : la cadence d'équipe
        `_planTeamCadence_` exécutée, formation à 0.
     B. Les appelants (lus sans commentaires) : Décider et la cadence contre barème
        (`_pecCadPresence`, `_pecCadHisto`) lisent `_planChampPersRange` ; le taux
        horaire pondéré et l'exercice (heures payées) restent sur `_planWorkPersRange`.

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
const BASE = { plan: lire('src/planning.js'), pil: lire('src/pilotage.js') };

/* ── Lecture ─────────────────────────────────────────────────────────────── */
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
function table(src, decl, fin) {
  const i = src.indexOf(decl);
  if (i < 0) return null;
  const j = src.indexOf(fin, i);
  return j < 0 ? null : src.slice(i, j + fin.length);
}
const nu = s => s.split('\n').filter(l => !l.trimStart().startsWith('//')).join('\n');

const VOULUES = ['_planChampH', '_planWorkH', '_planDayH', '_planRefH', '_planRefPart', '_planAbsMotif',
  '_planAbsDef', '_planAbsPartiel', '_planAbsH', '_planMinOf', '_planPlanned', '_planRecupActiveAt',
  '_planDefTiming', '_planTimingH', '_planRangeH_', '_planTeamCadence_'];

/* Stubs : ils RENDENT des données, ils ne calculent rien de métier. */
const PRELUDE = `
var PLAN_PAUSE_MIN = 60, planMonth = 8, planYear = 2026, _planCtxYear = null;
var PLANNING_TEMPLATES = {}, PLANNING_ENTRIES = {}, TPL = {}, CONTRAT = true, EFFN = 1;
function _pY(){ return _planCtxYear!=null?_planCtxYear:planYear; }
function _planDuesActive(){ return false; }
function _planPlId(m){ return (m&&m.planning_id)||'A'; }
function _planGetTpl(){ return TPL; }
function _pEntDay(nom,m,d){ return (((PLANNING_ENTRIES[nom]||{})[_pY()]||{})[m]||{})[d]; }
function _planInContractRead(){ return CONTRAT; }
function _planInContract(){ return CONTRAT; }
function _planFerie(){ return null; }
function _planDow(m,d){ return new Date(_pY(),m,d).getDay(); }
function _planEffN(){ return EFFN; }
function _planMigrateYears(){}
function _planMbrsPer(){ return [{nom:'Jean'}]; }
var window = {};
`;

function charger(src) {
  const morceaux = [], manque = [];
  for (const n of VOULUES) { const f = extraire(src.plan, n); if (f) morceaux.push(f); else manque.push(n); }
  const tMotifs = table(src.plan, 'var PLAN_ABS_MOTIFS=[', '];');
  const tDefT   = table(src.plan, 'var PLAN_DEF_T = {', '};');
  const dRecup  = table(src.plan, "var PLAN_RECUP_DEBUT='", "';");
  if (!tMotifs) manque.push('PLAN_ABS_MOTIFS'); if (!tDefT) manque.push('PLAN_DEF_T'); if (!dRecup) manque.push('PLAN_RECUP_DEBUT');
  if (manque.length) return { manque };
  const code = PRELUDE + dRecup + '\n' + tDefT + '\n' + tMotifs + '\n' + morceaux.join('\n') + `
;return { champ:_planChampH, work:_planWorkH, range:_planRangeH_, cad:_planTeamCadence_,
  set:function(o){ if(o.tpl){ TPL=o.tpl; PLANNING_TEMPLATES[planYear]={A:TPL}; }
    if(o.ent) PLANNING_ENTRIES=o.ent; if(o.effn!=null) EFFN=o.effn; if(o.contrat!=null) CONTRAT=o.contrat; } };`;
  return { M: new Function(code)() };
}

/* Septembre 2026 (mois 8) : lundi 21 → vendredi 25, 7 h prévues, départ 08:00. */
const TPLS = { 8: { 21: 7, 22: 7, 23: 7, 24: 7, 25: 7 }, _timings: { 8: { d: '08:00' } } };
const JOUR = { 21: null,
  22: { type: 'cp' },
  23: { absent: true, motif: 'formation' },
  24: { absent: true, motif: 'arret' },
  25: { absent: true, motif: 'famille' } };

function scenarios(M) {
  const R = [], eq = (n, a, b) => R.push([n + (Math.abs(a - b) < 1e-6 ? '' : ' — obtenu ' + a + ', attendu ' + b), Math.abs(a - b) < 1e-6]);
  M.set({ tpl: TPLS, ent: {}, effn: 1, contrat: true });
  const c = (e, d) => M.champ('A', 8, d || 21, e, 2026);
  const w = (e, d) => M.work('A', 8, d || 21, e, 2026);
  eq('A1 · jour ordinaire : 7 h dans les rangs', c(null), 7);
  eq('A2 · congé payé : 0 h dans les rangs', c({ type: 'cp' }), 0);
  eq('A3 · récup : 0 h dans les rangs', c({ type: 'recup' }), 0);
  eq('A4 · arrêt de travail : 0 h dans les rangs', c({ absent: true, motif: 'arret' }), 0);
  eq('A5 · absence injustifiée : 0 h dans les rangs', c({ absent: true, motif: 'injustifie' }), 0);
  eq('A6 · absence ancienne sans motif : 0 h dans les rangs', c({ absent: true }), 0);
  eq('A7 · ★ FORMATION : 0 h dans les rangs', c({ absent: true, motif: 'formation' }), 0);
  eq('A8 · ★ événement familial : 0 h dans les rangs', c({ absent: true, motif: 'famille' }), 0);
  eq('A9 · formation l\'après-midi (13:00 → 16:00) : la matinée compte', c({ absent: true, motif: 'formation', abs_de: '13:00', abs_a: '16:00', motif_h: 3 }), 4);
  eq('A10 · rendez-vous perso 2 h : 5 h dans les rangs (inchangé)', c({ absent: true, motif: 'perso', abs_de: '14:00', abs_a: '16:00', motif_h: 2 }), 5);
  eq('A11 · journée modifiée +1 h : 8 h dans les rangs (inchangé)', c({ modifier: 1 }), 8);
  // Le travail effectif de la loi ne bouge pas : la paie et l'annualisation lisent toujours la formation.
  eq('A12 · travail effectif : la formation vaut toujours la journée', w({ absent: true, motif: 'formation' }), 7);
  eq('A13 · travail effectif : l\'événement familial vaut toujours la journée', w({ absent: true, motif: 'famille' }), 7);
  // La semaine entière, par le vrai parcours de plage.
  M.set({ ent: { Jean: { 2026: { 8: JOUR } } } });
  const du = new Date(2026, 8, 21, 12), au = new Date(2026, 8, 25, 12), mb = { nom: 'Jean' };
  eq('A14 · semaine lun.→ven. : 7 h dans les rangs (lundi seul)', M.range(mb, du, au, 'champ'), 7);
  eq('A15 · la même semaine en travail effectif : 21 h (lundi + formation + famille)', M.range(mb, du, au, 'work'), 21);
  const mer = new Date(2026, 8, 23, 12);
  eq('A16 · un jour de formation, à lui seul : 0 h', M.range(mb, mer, mer, 'champ'), 0);
  const cad = M.cad(du, au);
  eq('A19 · cadence d\'équipe (CHAMP-2) : 7 h sur la semaine, pas 21', cad.totalH, 7);
  eq('A20 · cadence d\'équipe : un seul jour travaillé dans les rangs', cad.joursOuvres, 1);
  M.set({ effn: 6 });
  eq('A17 · équipe collective : le lundi compte ×6', M.range(mb, du, du, 'champ'), 42);
  M.set({ effn: 1, contrat: false });
  eq('A18 · hors contrat : 0 h', M.range(mb, du, du, 'champ'), 0);
  return R;
}

function appelants(src) {
  const R = [], P = nu(src.plan), L = nu(src.pil);
  const jm = extraire(L, '_dzJourMbr') || '';
  R.push(['B1 · la journée de Décider vient de _planChampPersRange, jour par jour', /_planChampPersRange\(m,dt,dt\)/.test(jm)]);
  R.push(['B2 · Décider ne lit plus le travail effectif', !/_planWorkPersRange/.test(jm)]);
  R.push(['B3 · la plage lit _planChampH en mode \'champ\'', /mode==='champ'\)\?_planChampH\(/.test(extraire(P, '_planRangeH_') || '')]);
  R.push(['B4 · _planChampPersRange est exposée', /window\._planChampPersRange\s*=\s*_planChampPersRange;/.test(P)
    && /function _planChampPersRange\(mbr,from,to\)\{ return _planRangeH\(mbr,from,to,'champ'\); \}/.test(P)]);
  const er = extraire(L, '_ecoRate') || '', cp = extraire(L, '_pecCadPresence') || '';
  const ch = extraire(L, '_pecCadHisto') || '';
  R.push(['B5 · le taux horaire pondéré reste sur le travail effectif (heures payées)', /_planWorkPersRange\(/.test(er) && !/_planChampPersRange/.test(er)]);
  R.push(['B7 · la cadence contre barème lit les heures dans les rangs (période et campagne d\'avant)',
    /_planChampPersRange\(m,D0,D1\)/.test(cp) && /_planChampPersRange\(m,D0,D1\)/.test(ch) && !/_planWorkPersRange/.test(cp + ch)]);
  R.push(['B8 · la cadence d\'équipe lit _planChampH', /var hM = _planChampH\(/.test(extraire(P, '_planTeamCadence_') || '')]);
  const mo = extraire(L, '_dzMotif') || '';
  R.push(['B6 · la liste des absents dit « en formation » et « en arrêt »', /'en formation'/.test(mo) && /'en arr\\u00eat'/.test(mo)]);
  return R;
}

function mesurer(src) {
  let ch;
  try { ch = charger(src); } catch (e) { return [['le code extrait s\'exécute (' + e.message + ')', false]]; }
  if (ch.manque) return [['extraction : ' + ch.manque.join(', ') + ' introuvable(s)', false]];
  let sc;
  try { sc = scenarios(ch.M); } catch (e) { sc = [['les scénarios s\'exécutent (' + e.message + ')', false]]; }
  return sc.concat(appelants(src));
}

/* ── Référence ───────────────────────────────────────────────────────────── */
let ok = 0, ko = 0;
console.log('\n── QUI EST DANS LES RANGS CE JOUR-LÀ — lot CHAMP-1\n');
for (const [nom, cond] of mesurer(BASE)) {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); }
}
console.log('\n  ' + ok + ' vertes, ' + ko + ' rouges\n');
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) { console.log('  contre-épreuve non jouée : la référence est rouge'); process.exit(1); }

/* ── Contre-épreuves ─────────────────────────────────────────────────────── */
const DEFAUTS = [
  { nom: 'la formation redevient du temps dans les rangs (le défaut d\'origine)', f: 'plan',
    de: "  if(e&&e.absent&&_planAbsMotif(e).assim){", vers: "  if(false){" },
  { nom: 'une formation partielle efface toute la journée', f: 'plan',
    de: "    if(_planAbsPartiel(e))return Math.max(0,_planRefH(plId,m,d,e,yr)-_planAbsH(e));\n    return 0;\n  }\n  return _planWorkH(",
    vers: "    return 0;\n  }\n  return _planWorkH(" },
  { nom: 'la plage ignore le mode \'champ\'', f: 'plan',
    de: "var h=(mode==='champ')?_planChampH(plId,mi,d,e,yr):", vers: "var h=" },
  { nom: 'Décider relit le travail effectif', f: 'pil',
    de: "window._planChampPersRange(m,dt,dt)", vers: "window._planWorkPersRange(m,dt,dt)" },
  { nom: 'la cadence d\'équipe relit le travail effectif', f: 'plan',
    de: "var hM = _planChampH(_planPlId(mbr), m, d, ent, yr);", vers: "var hM = _planWorkH(_planPlId(mbr), m, d, ent, yr);" },
  { nom: 'la cadence contre barème relit le travail effectif (période en cours)', f: 'pil',
    de: "    try{ v=Number(window._planChampPersRange(m,D0,D1))||0; }\n    catch(e){ if(window.logError) window.logError({level:'info',cat:'eco',msg:'cadence presence '",
    vers: "    try{ v=Number(window._planWorkPersRange(m,D0,D1))||0; }\n    catch(e){ if(window.logError) window.logError({level:'info',cat:'eco',msg:'cadence presence '" },
  { nom: 'la cadence de la campagne d\'avant relit le travail effectif', f: 'pil',
    de: "    try{ v=Number(window._planChampPersRange(m,D0,D1))||0; }\n    catch(e){ if(window.logError) window.logError({level:'info',cat:'eco',msg:'cadence histo '",
    vers: "    try{ v=Number(window._planWorkPersRange(m,D0,D1))||0; }\n    catch(e){ if(window.logError) window.logError({level:'info',cat:'eco',msg:'cadence histo '" },
  { nom: 'le taux horaire passe sur les heures dans les rangs', f: 'pil',
    de: "h=Number(window._planWorkPersRange(m,dA,dB))||0;", vers: "h=Number(window._planChampPersRange(m,dA,dB))||0;" },
  { nom: 'la fonction n\'est plus exposée', f: 'plan',
    de: "window._planChampPersRange = _planChampPersRange;", vers: "" },
  { nom: 'la formation est dite « absent » dans la liste', f: 'pil',
    de: "mo==='formation'?'en formation':", vers: "" },
  { nom: 'le travail effectif perd la formation (la paie serait fausse)', f: 'plan',
    de: "    if(mo.assim)return prevu;                              // formation / evenement familial", vers: "" },
];
let mord = 0, muet = 0;
console.log('── Contre-épreuves (' + DEFAUTS.length + ')\n');
for (const D of DEFAUTS) {
  const src = Object.assign({}, BASE);
  if (src[D.f].split(D.de).length !== 2) { console.log('  \x1b[31m✗ ancre introuvable ou multiple : ' + D.nom + '\x1b[0m'); muet++; continue; }
  src[D.f] = src[D.f].replace(D.de, D.vers);
  const r = mesurer(src).filter(x => !x[1]);
  if (r.length) { mord++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + D.nom + '  (' + r[0][0].split(' — ')[0] + ')'); }
  else { muet++; console.log('  \x1b[31m✗ MUETTE : ' + D.nom + '\x1b[0m'); }
}
console.log('\n  ' + mord + ' mordent, ' + muet + ' muettes\n');
process.exit(muet ? 1 : 0);
