/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — PROG-1 (§545) : LE PROGRAMME INDICATIF DE MODULATION (accord national, art. 10.4)
   Lancer : node scripts/mv-harnais-prog1.mjs          (le contrôle)
            node scripts/mv-harnais-prog1.mjs --contre  (chaque défaut reposé doit rougir)
   Les VRAIES fonctions (src/planning-annee.js, et la base de l'année de src/planning.js). Lu à la main avant le premier
   passage : le modèle 2027 de la maquette — janvier-février en activité réduite (lundi au jeudi 7 h, vendredi 4 h), l'été
   en forte activité (8 h 30, vendredi 5 h), les vendanges en semaine à part (lundi au samedi 7 h), environ 100 h de
   modulation donc la formule à 150 h, la base de 1 827 h, la solidarité étalée, l'affichage au plus tard le 25 décembre
   2026 ; la grille 2026 du modèle « standard » — ses fermetures en activité nulle, les 1 607 h de l'ancienne règle,
   l'affichage au 25 décembre 2025 ; un modèle chargé (45 h l'été) — plus de 200 h de modulation, la formule à 100 h.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const SOURCES = () => lire('src/planning.js') + '\n' + lire('src/planning-annee.js');
const DEFAUTS = {
  affichage: ['l’affichage se date du 25 décembre de l’année même', "var aff=(yr-1)+'-12-25',affTxt='25 d\\u00e9cembre '+(yr-1);", "var aff=yr+'-12-25',affTxt='25 d\\u00e9cembre '+yr;"],
  nature:    ['forte et réduite s’inversent', "(t>ref?'Forte activit\\u00e9':(t<ref?'Activit\\u00e9 r\\u00e9duite':", "(t<ref?'Forte activit\\u00e9':(t>ref?'Activit\\u00e9 r\\u00e9duite':"],
  formule:   ['le seuil des 200 h de la formule glisse', "  var formule=mod<=200?", "  var formule=mod<=300?"],
};
if (CONTRE) {
  console.log('\n── PROG-1 — contre-épreuve (un processus par défaut)\n');
  const src = SOURCES(); let tenues = 0, total = 0;
  for (const [cle, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-prog1-')), fp = path.join(tmp, 'sources.js');
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 120000, env: Object.assign({}, process.env, { MV_PROG1_SOURCES: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const vu = r.status !== 0, det = String(r.stdout || '').split('\n').filter(l => l.includes('✗'))[0] || '';
    if (vu) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.trim().slice(0, 110) + ')' : '')); } else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`);
  process.exit(tenues === total ? 0 : 1);
}
const PL = process.env.MV_PROG1_SOURCES ? fs.readFileSync(process.env.MV_PROG1_SOURCES, 'utf8') : SOURCES();
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades : ' + nom);
}
const NOMS = ['_mvEasterMD', '_feriesY', '_planBaseActive', '_planJoursSem', '_planBaseAn', '_planSolid', '_planSolidJour', '_planEstSolid', '_planSolidRatio', '_planCreditFerie',
  '_planAnneeSaison', '_planAnneeLire', '_planAnneeDate', '_planAnneePlage', '_planAnneeHoraireTxt', '_planAnneeNature', '_planAnneeModulation', '_planAnneeProgramme'];
const MODES = /var PLAN_SOLID_MODES=\{[^;]*\};/.exec(PL)[0];
const i0 = PL.indexOf('var PLAN_DEF = {'), j0 = PL.indexOf('};', i0);
const PLAN_DEF = vm.runInNewContext('(' + PL.slice(i0 + 15, j0 + 1) + ')');
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const ctx = vm.createContext({ window: { CONFIG: {}, PLAN_MOIS: MOIS }, _MV_FERIES_CACHE: {}, PLAN_MOIS: MOIS, PLAN_MOIS_FR: ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'] });
vm.runInContext(MODES + '\nwindow.PLAN_SOLID_MODES=PLAN_SOLID_MODES;\nfunction _pY(){return 2027;}\nfunction _planLegal(){return {hebdoLeg:35,modulMax:250,plafAnnuel:1607};}\nfunction _planFmt(h){return String(Math.round(h*100)/100)+" h";}\n'
  + 'function _escHtml(x){return String(x);}\nfunction _planMbrs(){return [{nom:"Marie",pl:"ouvert"},{nom:"Jean",pl:"ouvert"},{nom:"Paul",pl:"standard"}];}\nfunction _planPlId(m){return m.pl;}\n'
  + NOMS.map(n => fonction(PL, n)).join('\n') + '\nthis.prog=_planAnneeProgramme;this.mod=_planAnneeModulation;this.lire=_planAnneeLire;', ctx);
function rythme(d, ete) { const m = d.getMonth(), j = d.getDate(), g = d.getDay();
  if (m === 8 && j >= 6 && j <= 11) return g >= 1 && g <= 6 ? 7 : 0;
  const S = m < 2 ? [7, 4] : m === 2 ? [7.5, 4] : m === 3 ? [8, 5] : m < 9 ? (ete || [8.5, 5]) : (m === 9 || (m === 10 && j < 15)) ? [7, 4] : [7, 0];
  return g >= 1 && g <= 4 ? S[0] : g === 5 ? S[1] : 0; }
function modele(an, ete) { const F = vm.runInContext('_feriesY(' + an + ')', ctx), t = {};
  for (let d = new Date(an, 0, 1); d.getFullYear() === an; d.setDate(d.getDate() + 1)) { const m = d.getMonth(), j = d.getDate(); if (F[m] && F[m][j]) continue;
    const h = (an === 2027 && m === 11 && j === 23) ? 6.5 : rythme(d, ete); if (h > 0) (t[m] = t[m] || {})[j] = h; } return t; }
const TPL = { ouvert: { 2027: modele(2027) }, standard: { 2026: PLAN_DEF.standard }, charge: { 2027: modele(2027, [10, 5]) } };
ctx._planGetTpl = (pl, y) => (TPL[pl] && TPL[pl][y]) || {};
let verts = 0; const ECHECS = [];
function T(ok, quoi, det) { if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + (det ? ' — ' + det : '')); } }
const ligne = (H, debut) => { const m = new RegExp('<tr><td>' + debut + '[^<]*</td><td>([^<]*)</td><td>([^<]*)</td><td>([^<]*)</td></tr>').exec(H); return m ? [m[1], m[2], m[3]] : null; };
console.log('\n── PROG-1 — le modèle 2027 de la maquette\n');
ctx.window.CONFIG = { solidarite: { 2027: { mode: 'etalee' } } };
const H = ctx.prog('ouvert', 2027);
T(/art\. 10\.4/.test(H) && /du 1er janvier au 31 d.cembre 2027/.test(H), 'le programme cite l’accord (art. 10.4) et sa période');
T(/Marie · Jean/.test(H) && !/Paul/.test(H), 'les salariés concernés : ceux du modèle, seuls');
const jan = ligne(H, '1er\u00a0janv\\.');
T(!!jan && jan[0] === 'Activité réduite' && jan[2] === 'lundi au jeudi 7 h · vendredi 4 h', 'janvier-février : activité réduite, lundi au jeudi 7 h, vendredi 4 h', JSON.stringify(jan));
const ete = ligne(H, '1er\u00a0mai');
T(!!ete && ete[0] === 'Forte activité' && ete[2] === 'lundi au jeudi 8.5 h · vendredi 5 h', 'l’été : forte activité, 8 h 30 et vendredi 5 h', JSON.stringify(ete));
T(/\(semaine à part\)<\/td><td>Forte activité<\/td><td>42 h<\/td><td>lundi au samedi 7 h<\/td>/.test(H), 'les vendanges : semaine à part, forte activité, lundi au samedi 7 h');
const m27 = ctx.mod('ouvert', 2027, ctx.lire('ouvert', 2027));
T(m27 > 50 && m27 <= 200 && /contingent d.heures suppl.mentaires hors modulation de 150 h/.test(H), 'environ 100 h de modulation : la formule à 150 h', String(m27));
T(/261 jours du lundi au vendredi × 7 h = 1827 h/.test(H) && /solidarit.\u00a0: .tal.e sur l.ann.e, 7 h/.test(H), 'la base de 1 827 h et la solidarité étalée');
T(/data-aff="2026-12-25">25 décembre 2026</.test(H), 'à afficher au plus tard le 25 décembre 2026');
console.log('\n── la grille 2026 du modèle « standard » (ancienne règle)\n');
vm.runInContext('_pY=function(){return 2026;};', ctx);
const S = ctx.prog('standard', 2026);
T((S.match(/Activité nulle — fermeture/g) || []).length === 4, 'ses quatre fermetures en activité nulle');
T(/Durée annuelle de référence\u00a0: 1607 h de travail effectif/.test(S) && /data-aff="2025-12-25"/.test(S), 'les 1 607 h de l’ancienne règle, l’affichage au 25 décembre 2025');
console.log('\n── un modèle chargé (45 h l’été)\n');
vm.runInContext('_pY=function(){return 2027;};', ctx);
const C = ctx.prog('charge', 2027), mc = ctx.mod('charge', 2027, ctx.lire('charge', 2027));
T(mc > 200 && /hors modulation de 100 h/.test(C), 'plus de 200 h de modulation : la formule à 100 h', String(mc));
console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
