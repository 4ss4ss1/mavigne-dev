// ════════════════════════════════════════════════════════════════════════════
// HARNAIS — MAJORATION DIMANCHE / JOUR FERIE (lot MAJ-1)
// ════════════════════════════════════════════════════════════════════════════
// Les fonctions sont EXTRAITES DU FICHIER REEL (src/planning.js) par equilibrage
// d'accolades, puis executees dans un `vm` a `window` stubbe. Un harnais qui
// recopie la logique ne teste que la copie.
//
// Ce qui est REEL ici : _feriesY / _mvEasterMD (le calendrier), _planFerie,
// _planDow, _planDays, _planDayStatus et toute sa chaine de motifs d'absence,
// _planMajTaux, _planMajActive, _planMajMonth, _planMajBank.
// Ce qui est STUBBE : _planPlanned, _planWorkH, _pEntMonth, _planPlId,
// _planInContractCtr — ce sont les entrees du scenario, pas la logique testee.
//
// Lancer : node scripts/mv-harnais-majoration.mjs
//          node scripts/mv-harnais-majoration.mjs --contre   (contre-epreuve)
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC  = fs.readFileSync(path.join(ROOT, 'src/planning.js'), 'utf8');
const CONTRE = process.argv.includes('--contre');

// ── Extraction par equilibrage d'accolades ──────────────────────────────────
function pickFn(name){
  const sig = 'function ' + name + '(';
  const i = SRC.indexOf(sig);
  if (i < 0) throw new Error('fonction introuvable : ' + name);
  let j = SRC.indexOf('{', i), depth = 0, inStr = null, k = j;
  for (; k < SRC.length; k++){
    const c = SRC[k], p = SRC[k-1];
    if (inStr){ if (c === inStr && p !== '\\') inStr = null; continue; }
    if (c === '"' || c === "'"){ inStr = c; continue; }
    if (c === '/' && SRC[k+1] === '/'){ k = SRC.indexOf('\n', k); continue; }
    if (c === '{') depth++;
    else if (c === '}'){ depth--; if (!depth) return SRC.slice(i, k+1); }
  }
  throw new Error('accolade non fermee : ' + name);
}
function pickVar(name){
  const sig = 'var ' + name + '=';
  const i = SRC.indexOf(sig);
  if (i < 0) throw new Error('variable introuvable : ' + name);
  // jusqu'au premier ';' hors chaine
  let inStr = null, depth = 0;
  for (let k = i; k < SRC.length; k++){
    const c = SRC[k], p = SRC[k-1];
    if (inStr){ if (c === inStr && p !== '\\') inStr = null; continue; }
    if (c === '"' || c === "'"){ inStr = c; continue; }
    if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
    else if (c === ';' && !depth) return SRC.slice(i, k+1);
  }
  throw new Error('point-virgule introuvable : ' + name);
}

const REEL = [
  pickVar('PLAN_ABS_MOTIFS'), pickVar('_MV_FERIES_CACHE'),
  pickVar('PLAN_MAJ_DEF'),    pickVar('PLAN_MAJ_DEBUT'),
  pickVar('_PLAN_ST_OFFDAY'),
  pickFn('_mvEasterMD'), pickFn('_feriesY'),  pickFn('_planFerie'),
  pickFn('_planAbsDef'), pickFn('_planAbsMotif'), pickFn('_planAbsT'),
  pickFn('_planMinOf'),  pickFn('_planTimingH'),
  pickFn('_planHsupMode'), pickFn('_planHsupPayable'),
  pickFn('_planDayStatus'),
  pickFn('_planMajTaux'), pickFn('_planMajActive'),
  pickFn('_planMajMonth'), pickFn('_planMajBank')
].join('\n');

// ── Contre-epreuve : quatre defauts reintroduits, un a un ────────────────────
const DEFAUTS = {
  'taux 0 ecrase par le defaut':
    [/return \{dim:\(isNaN\(d\)\|\|d<0\)\?PLAN_MAJ_DEF\.dim:d,\n\s+ferie:\(isNaN\(f\)\|\|f<0\)\?PLAN_MAJ_DEF\.ferie:f\};/,
     'return {dim:(d||PLAN_MAJ_DEF.dim),ferie:(f||PLAN_MAJ_DEF.ferie)};'],
  'ferie + dimanche cumules':
    [/var enFerie=!!f&&!\(dow===0&&T\.dim>T\.ferie\);\n\s+var tx=enFerie\?T\.ferie:T\.dim;/,
     'var enFerie=!!f;var tx=(enFerie?T.ferie:0)+(dow===0?T.dim:0);'],
  'fenetre de janvier 2026 supprimee':
    [/if\(!_planMajActive\(m\)\)return z;/, ''],
  'la majoration alimente le compteur meme en mode paye':
    [/function _planMajBank\(mbr,m\)\{return _planHsupPayable\(\)\?0:_planMajMonth\(mbr,m\)\.maj;\}/,
     'function _planMajBank(mbr,m){return _planMajMonth(mbr,m).maj;}']
};

// ── Contexte : ce qui n'est PAS teste est stubbe ─────────────────────────────
function faireCtx(code, scen){
  const win = { CONFIG: scen.CONFIG || {} };
  const AN = scen.annee;
  const ctx = {
    window: win, console,
    planYear: AN, _planCtxYear: null, PLAN_PAUSE_MIN: 60,
    _pY: () => AN,
    _planDays: (m) => new Date(AN, m+1, 0).getDate(),
    _planDow:  (m,d) => new Date(AN, m, d).getDay(),
    _planPlId: () => 'standard',
    _pEntMonth: () => scen.entrees || {},
    _planInContractCtr: (mbr,m,d) => scen.horsContrat ? !scen.horsContrat(d) : true,
    _planPlanned: (plId,m,d) => scen.modele ? scen.modele(m,d) : 0,
    // heures REELLEMENT faites ce jour-la : l'entree du scenario fait foi
    _planWorkH: (plId,m,d,e) => {
      if (!e) return scen.modele ? scen.modele(m,d) : 0;
      if (e.h != null) return e.h;
      if (e.type === 'cp' || e.type === 'recup' || (e.absent && !_estRetard(e))) return 0;
      return scen.modele ? scen.modele(m,d) : 0;
    }
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx);
  return ctx;
}
function _estRetard(e){ return e && e.absent && e.motif === 'retard'; }

// ── Assertions ───────────────────────────────────────────────────────────────
let ok = 0, ko = 0; const echecs = [];
function eq(label, attendu, obtenu){
  const a = Math.round(attendu*1000)/1000, b = Math.round((obtenu==null?NaN:obtenu)*1000)/1000;
  if (a === b) { ok++; }
  else { ko++; echecs.push(label + ' — attendu ' + a + ', obtenu ' + b); }
}

const MBR = { nom: 'Alexandre', planning_id: 'standard' };

function lance(code){
  ok = 0; ko = 0; echecs.length = 0;

  // 1. Dimanche travaille — 30 aout 2026, 8 h, taux 50
  let c = faireCtx(code, { annee: 2026, entrees: { 30: { h: 8, timing: { debut:'07:00', fin:'15:00' } } } });
  let z = c._planMajMonth(MBR, 7);
  eq('1 · dimanche 8 h a +50 %', 4, z.maj);
  eq('1b · rangees en dimanche', 8, z.hDim);
  eq('1c · rien en ferie', 0, z.hFer);

  // 2. Jour ferie travaille — 15 aout 2026 (un SAMEDI), 6 h, taux 100
  c = faireCtx(code, { annee: 2026, entrees: { 15: { h: 6, timing: { debut:'07:00', fin:'13:00' } } } });
  z = c._planMajMonth(MBR, 7);
  eq('2 · Assomption 6 h a +100 %', 6, z.maj);
  eq('2b · rangees en ferie', 6, z.hFer);

  // 3. COLLISION — 1er novembre 2026, Toussaint, tombe un DIMANCHE
  c = faireCtx(code, { annee: 2026, entrees: { 1: { h: 6, timing: { debut:'07:00', fin:'13:00' } } } });
  z = c._planMajMonth(MBR, 10);
  eq('3 · Toussaint un dimanche : le plus fort, pas les deux', 6, z.maj);
  eq('3b · rangee dans la ligne du taux retenu (ferie)', 6, z.hFer);
  eq('3c · rien en dimanche', 0, z.hDim);

  // 4. COLLISION INVERSEE — dimanche 120 %, ferie 100 % : le dimanche gagne
  c = faireCtx(code, { annee: 2026, CONFIG: { majorations: { dim: 120, ferie: 100 } },
                       entrees: { 1: { h: 6, timing: { debut:'07:00', fin:'13:00' } } } });
  z = c._planMajMonth(MBR, 10);
  eq('4 · dim 120 > ferie 100 : 7h12', 7.2, z.maj);
  eq('4b · rangee en dimanche, pas en ferie', 6, z.hDim);

  // 5. Ferie CHOME — aucune heure faite
  c = faireCtx(code, { annee: 2026, entrees: {} });
  eq('5 · ferie chome : rien', 0, c._planMajMonth(MBR, 10).maj);

  // 6/7/8. CP, recup, formation un dimanche : rien
  // ⚠️ Le modele ne porte des heures QUE sur le jour teste. Un `() => 8` global
  //    poserait 8 h sur les quatre dimanches de septembre, et le harnais mesurerait
  //    le mois entier en croyant mesurer une case. Premiere version rouge a 12 h
  //    pour cette raison : c'etait le scenario qui avait tort, pas le code.
  const seul6 = (m,d) => d === 6 ? 8 : 0;
  c = faireCtx(code, { annee: 2026, entrees: { 6: { type: 'cp', heures: 8 } }, modele: seul6 });
  eq('6 · CP un dimanche', 0, c._planMajMonth(MBR, 8).maj);
  c = faireCtx(code, { annee: 2026, entrees: { 6: { type: 'recup' } }, modele: seul6 });
  eq('7 · recup un dimanche', 0, c._planMajMonth(MBR, 8).maj);
  c = faireCtx(code, { annee: 2026, entrees: { 6: { absent: true, motif: 'formation' } }, modele: seul6 });
  eq('8 · formation un dimanche (assimilee, mais pas au domaine)', 0, c._planMajMonth(MBR, 8).maj);
  // 8b. LE MODELE FAIT FOI — un dimanche sur lequel le planning porte des heures,
  //     sans aucune entree saisie, est un jour travaille : il se majore.
  c = faireCtx(code, { annee: 2026, entrees: {}, modele: seul6 });
  eq('8b · dimanche porte par le modele, sans saisie', 4, c._planMajMonth(MBR, 8).maj);

  // 9. RETARD un dimanche : majore ce qui reste de la journee
  c = faireCtx(code, { annee: 2026, entrees: { 6: { absent: true, motif: 'retard', motif_t: '09:00', motif_h: 2, h: 6 } } });
  eq('9 · retard un dimanche : 6 h restantes a +50 %', 3, c._planMajMonth(MBR, 8).maj);

  // 10. Samedi travaille, non ferie : rien
  c = faireCtx(code, { annee: 2026, entrees: { 12: { h: 9, timing: { debut:'07:00', fin:'16:00' } } } });
  eq('10 · samedi non ferie', 0, c._planMajMonth(MBR, 8).maj);

  // 11. TAUX A ZERO — valeur legitime, jamais ecrasee par le defaut
  c = faireCtx(code, { annee: 2026, CONFIG: { majorations: { dim: 0, ferie: 0 } },
                       entrees: { 6: { h: 8, timing: { debut:'07:00', fin:'15:00' } } } });
  eq('11 · taux 0 respecte', 0, c._planMajMonth(MBR, 8).maj);
  eq('11b · le reglage rend bien 0', 0, c._planMajTaux().dim);

  // 12. FENETRE — 2025 ne bouge pas
  c = faireCtx(code, { annee: 2025, entrees: { 7: { h: 8, timing: { debut:'07:00', fin:'15:00' } } } });
  eq('12 · septembre 2025 hors fenetre', 0, c._planMajMonth(MBR, 8).maj);
  c = faireCtx(code, { annee: 2026, entrees: { 6: { h: 8, timing: { debut:'07:00', fin:'15:00' } } } });
  eq('12b · septembre 2026 dans la fenetre', 4, c._planMajMonth(MBR, 8).maj);

  // 13. HORS CONTRAT
  c = faireCtx(code, { annee: 2026, entrees: { 6: { h: 8, timing: { debut:'07:00', fin:'15:00' } } },
                       horsContrat: d => d === 6 });
  eq('13 · jour hors contrat', 0, c._planMajMonth(MBR, 8).maj);

  // 14. _planMajBank — c'est hsup_mode qui decide, et lui seul
  const ent14 = { 6: { h: 8, timing: { debut:'07:00', fin:'15:00' } } };
  c = faireCtx(code, { annee: 2026, CONFIG: { hsup_mode: 'paye' }, entrees: ent14 });
  eq('14 · mode paye : rien au compteur', 0, c._planMajBank(MBR, 8));
  eq('14b · mais la majoration existe', 4, c._planMajMonth(MBR, 8).maj);
  c = faireCtx(code, { annee: 2026, CONFIG: { hsup_mode: 'recup' }, entrees: ent14 });
  eq('14c · mode recup : au compteur', 4, c._planMajBank(MBR, 8));
  c = faireCtx(code, { annee: 2026, CONFIG: { hsup_mode: 'cloture' }, entrees: ent14 });
  eq('14d · mode cloture : au compteur', 4, c._planMajBank(MBR, 8));

  // 15. Le calendrier reel — Paques mobile, 2026 et 2027
  c = faireCtx(code, { annee: 2026, entrees: {} });
  eq('15 · 1er nov 2026 est bien un dimanche', 0, c._planDow(10, 1));
  eq('15b · 15 aout 2026 est bien un samedi', 6, c._planDow(7, 15));
  if (c._planFerie(4, 14) !== 'Ascension') { ko++; echecs.push('15c · Ascension 14 mai 2026 (mobile)'); } else ok++;

  return { ok, ko, echecs: echecs.slice() };
}

// ── Execution ────────────────────────────────────────────────────────────────
const r = lance(REEL);
console.log('HARNAIS MAJORATION — ' + r.ok + ' vert' + (r.ok > 1 ? 's' : '') + ', ' + r.ko + ' rouge' + (r.ko > 1 ? 's' : ''));
r.echecs.forEach(e => console.log('  ROUGE  ' + e));

let sortie = r.ko ? 1 : 0;

if (CONTRE) {
  console.log('\nCONTRE-EPREUVE — chaque defaut reintroduit doit faire ROUGIR le harnais');
  let manques = 0;
  for (const [nom, [motif, remplacement]] of Object.entries(DEFAUTS)) {
    if (!motif.test(REEL)) { console.log('  ?      ' + nom + ' — motif introuvable, defaut non injectable'); manques++; continue; }
    const casse = REEL.replace(motif, remplacement);
    let res;
    try { res = lance(casse); } catch (e) { res = { ok: 0, ko: 1, echecs: ['crash : ' + e.message] }; }
    if (res.ko > 0) console.log('  DETECTE  ' + nom + ' (' + res.ko + ' rouge' + (res.ko > 1 ? 's' : '') + ')');
    else { console.log('  MANQUE   ' + nom + ' — le harnais reste vert, il ne prouve rien'); manques++; }
  }
  if (manques) sortie = 1;
  console.log(manques ? '\n' + manques + ' defaut(s) non detecte(s).' : '\nLes quatre defauts sont detectes.');
}

process.exit(sortie);
