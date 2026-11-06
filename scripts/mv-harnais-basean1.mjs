/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — BASEAN-1 (§538) : LA BASE DE L'ANNÉE ET LA JOURNÉE DE SOLIDARITÉ
   Lancer : node scripts/mv-harnais-basean1.mjs          (le contrôle)
            node scripts/mv-harnais-basean1.mjs --contre  (chaque défaut reposé doit rougir)
   La règle (maquette v2 validée le 06/11) : la base de l'année = 7 h × les jours du lundi au vendredi (35 h par
   semaine en moyenne), à partir de 2027 ; un congé et un férié chômé comptent les heures prévues ce jour-là ;
   la journée de solidarité (7 h, au prorata d'un temps partiel) : étalée, un férié travaillé (sans majoration),
   un autre jour, ou offerte ; dispensés : déjà faite ailleurs (tous les modes), moins de 18 ans si c'est un férié.
   Les VRAIES fonctions, extraites de src/planning.js, jouées sur 2027 et ses fériés réels, avec un modèle d'équipe
   « domaine ouvert » (les rythmes de la maquette v2 : janvier-février 32 h, mars 34 h, avril 37 h, mai-septembre
   39 h, vendanges 42 h, octobre 32 h, fin d'année 28 h ; fériés à 0 au modèle ; la veille de Noël à 6 h 30).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');

const DEFAUTS = {
  credit:   ['un férié chômé ne compte plus ses heures prévues', '    if(F[xm]&&F[xm][xd])continue;var w=raw(xm,xd);if(w>0)return w;}', '    if(F[xm]&&F[xm][xd])continue;var w=raw(xm,xd);if(w>0)return 0;}'],
  cp:       ['un congé ne compte plus ses heures prévues', '    var h=parseFloat(e.heures)||_planPlanned(plId,m,d,yr);', '    var h=0;'],
  solidcredit: ['le jour de solidarité perd son crédit de férié', "    if(_planEstSolid(yr,m,d)){if(!e&&!_planSolidFait(mbr,yr))w=0;return w+_planCreditFerie(plId,yr,m,d);}", '    if(_planEstSolid(yr,m,d)){return w;}'],
  majoration: ['la journée de solidarité travaillée un férié redevient majorée', "if(f&&mbr&&_planEstSolid(y,m,d)&&_planSolidFait(mbr,y))return null;return f;}", "if(f&&mbr&&_planEstSolid(y,m,d)&&_planSolidFait(mbr,y))return f;return f;}"],
  depuis:   ['la base s’applique dès 2026, année commencée', 'return yr>=((c!=null&&!isNaN(+c))?+c:2027);}', 'return yr>=((c!=null&&!isNaN(+c))?+c:2026);}'],
  mineur:   ['un moins de 18 ans est dispensé même hors férié', "  if(d==='mineur'&&s.mode==='ferie')return false;", "  if(d==='mineur')return false;"],
};

if (CONTRE) {
  console.log('\n── BASEAN-1 — contre-épreuve (un processus par défaut)\n');
  const src = lire('src/planning.js'); let tenues = 0, total = 0;
  for (const [cle, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-basean1-')), fp = path.join(tmp, 'planning.js');
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 120000, env: Object.assign({}, process.env, { MV_BASEAN1_PLANNING: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const vu = r.status !== 0, det = String(r.stdout || '').split('\n').filter(l => l.includes('✗'))[0] || '';
    if (vu) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.trim().slice(0, 110) + ')' : '')); }
    else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`);
  process.exit(tenues === total ? 0 : 1);
}

const PL = process.env.MV_BASEAN1_PLANNING ? fs.readFileSync(process.env.MV_BASEAN1_PLANNING, 'utf8') : lire('src/planning.js');
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) throw new Error('ABSENTE de src/planning.js : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades déséquilibrées : ' + nom);
}
const NOMS = ['_mvEasterMD', '_feriesY', '_planFerie', '_planBaseActive', '_planJoursSem', '_planBaseAn', '_planSolid', '_planSolidCle',
  '_planSolidFait', '_planSolidJour', '_planEstSolid', '_planSolidRatio', '_planFerieMbr', '_planCreditFerie', '_planSemFermee',
  '_planCompteH', '_planModelBrut', '_planBaseAttendue', '_planPlanned'];
const MODES = /var PLAN_SOLID_MODES=\{[^;]*\};/.exec(PL); if (!MODES) throw new Error('PLAN_SOLID_MODES absente');

const AN = 2027;
// le modèle d'équipe « domaine ouvert » : un rythme par mois, la semaine de vendanges, la fin d'année sans vendredi
function rythme(d) {
  const m = d.getMonth(), j = d.getDate(), g = d.getDay();               // g : 0 dimanche … 6 samedi
  if (m === 8 && j >= 6 && j <= 11) return g >= 1 && g <= 6 ? 7 : 0;      // vendanges, lundi→samedi 7 h
  const S = m < 2 ? [7, 4] : m === 2 ? [7.5, 4] : m === 3 ? [8, 5] : m < 9 ? [8.5, 5] : (m === 9 || (m === 10 && j < 15)) ? [7, 4] : [7, 0];
  return g >= 1 && g <= 4 ? S[0] : g === 5 ? S[1] : 0;
}
function modele(f) { const t = {}; for (let d = new Date(AN, 0, 1); d.getFullYear() === AN; d.setDate(d.getDate() + 1)) { const h = f(d); if (h > 0) (t[d.getMonth()] = t[d.getMonth()] || {})[d.getDate()] = h; } return t; }
const FER = (() => { const c = vm.createContext({ window: {}, _MV_FERIES_CACHE: {} }); vm.runInContext(fonction(PL, '_mvEasterMD') + fonction(PL, '_feriesY') + ';this.F=_feriesY(' + AN + ');', c); return c.F; })();
const estFer = d => !!(FER[d.getMonth()] && FER[d.getMonth()][d.getDate()]);
const TPL = {
  equipe: modele(d => estFer(d) ? 0 : (d.getMonth() === 11 && d.getDate() === 23 ? 6.5 : rythme(d))),
  ferme:  modele(d => estFer(d) ? 0 : ((d.getMonth() === 7 && d.getDate() >= 2 && d.getDate() <= 20) ? 0 : rythme(d))),
  moitie: modele(d => estFer(d) ? 0 : rythme(d) / 2),
};
const window = { CONFIG: {}, _mvAnnualise: m => !['TESA', 'Saisonnier', 'Extra'].includes(m.type_contrat || 'CDI') };
const ctx = vm.createContext({ window, _MV_FERIES_CACHE: {}, PLAN_MOIS: [], _an: AN,
  _pY: () => ctx._an, _planGetTpl: (pl, y) => TPL[pl] || {},
  _planWorkH: (pl, m, d, e, y) => (e && e.type === 'cp') ? 0 : (e && e.h != null) ? e.h : ctx._planPlanned(pl, m, d, y) });
vm.runInContext(MODES[0] + '\n' + NOMS.map(n => fonction(PL, n)).join('\n') + '\nthis._planPlanned=_planPlanned;this.f={' + NOMS.join(',') + '};', ctx);
const F = ctx.f;

let verts = 0; const ECHECS = [];
function vaut(quoi, obtenu, attendu) {
  const ok = (typeof attendu === 'number') ? Math.abs(obtenu - attendu) < 0.001 : obtenu === attendu;
  if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' → ' + obtenu); }
  else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' → ' + obtenu + ' (attendu ' + attendu + ')'); }
}
function annee(pl, mbr, ent) { let t = 0; for (let d = new Date(AN, 0, 1); d.getFullYear() === AN; d.setDate(d.getDate() + 1)) { const m = d.getMonth(), j = d.getDate(); t += F._planCompteH(mbr, pl, m, j, (ent[m] || {})[j], AN); } return Math.round(t * 100) / 100; }
function cp(du, au, pl) { const E = {}; for (let d = new Date(AN, du[0], du[1]); d <= new Date(AN, au[0], au[1]); d.setDate(d.getDate() + 1)) { if (d.getDay() === 0 || estFer(d)) continue; const m = d.getMonth(), j = d.getDate(); (E[m] = E[m] || {})[j] = { type: 'cp', heures: (TPL[pl][m] || {})[j] || 0 }; } return E; }
const marie = { nom: 'Marie', type_contrat: 'CDI' }, paul = { nom: 'Paul', type_contrat: 'CDI' }, tesa = { nom: 'Léo', type_contrat: 'TESA' };

console.log('\n── BASEAN-1 — la base de l’année (2027, fériés réels, modèle « domaine ouvert »)\n');
vaut('base 2026 : 261 jours × 7 h', F._planBaseAn(2026), 1827);
vaut('base 2027', F._planBaseAn(2027), 1827);
vaut('base 2028 (260 jours)', F._planBaseAn(2028), 1820);
vaut('base 2032 (262 jours)', F._planBaseAn(2032), 1834);
vaut('2026 garde le plafond de Le cadre', F._planBaseActive(2026), false);
vaut('2027 passe à la base', F._planBaseActive(2027), true);
vaut('l’Ascension (jeudi 6 mai) compte un jeudi de mai : 8 h 30', F._planCreditFerie('equipe', AN, 4, 6), 8.5);
vaut('le 1er janvier (vendredi) compte un vendredi de janvier : 4 h', F._planCreditFerie('equipe', AN, 0, 1), 4);
vaut('Noël (samedi) ne compte rien : aucun samedi prévu', F._planCreditFerie('equipe', AN, 11, 25), 0);
vaut('le modèle d’équipe, fériés compris, tombe sur la base', Math.round(F._planModelBrut('equipe', AN) * 100) / 100, 1827);
const sans = annee('equipe', marie, {});
vaut('l’année de Marie sans congés (journées comme prévu)', sans, 1827);
vaut('trois semaines de congés en août ne changent rien', annee('equipe', marie, cp([7, 2], [7, 20], 'equipe')), sans);
vaut('une semaine de congés en octobre non plus', annee('equipe', marie, cp([9, 18], [9, 22], 'equipe')), sans);
const fe = cp([7, 2], [7, 20], 'ferme');
vaut('des congés posés sur une semaine fermée (0 h au modèle) comptent 7 h le jour', Math.round((annee('ferme', marie, fe) - annee('ferme', marie, {})) * 100) / 100, 15 * 7);
vaut('un temps partiel à moitié : la part du temps plein', F._planSolidRatio('moitie', AN), 0.5);

console.log('\n── la journée de solidarité\n');
window.CONFIG = { solidarite: { [AN]: { mode: 'etalee', dispenses: { Paul: 'mineur' } } } };
vaut('étalée : Marie la fait', F._planSolidFait(marie, AN), true);
vaut('étalée : un TESA, payé à l’heure, non', F._planSolidFait(tesa, AN), false);
vaut('étalée : un moins de 18 ans la fait (ce n’est pas un férié)', F._planSolidFait(paul, AN), true);
vaut('étalée : la base attendue du modèle passe à 1 834 h', F._planBaseAttendue('equipe', AN), 1834);
vaut('étalée : le lundi de Pentecôte reste chômé (0 h prévue)', F._planPlanned('equipe', 4, 17, AN), 0);
window.CONFIG = { solidarite: { [AN]: { mode: 'ferie', jour: '05-17', dispenses: { Paul: 'mineur' } } } };
vaut('férié : le lundi de Pentecôte devient 7 h prévues', F._planPlanned('equipe', 4, 17, AN), 7);
vaut('férié : pour Marie, ce n’est plus un férié (pas de majoration)', F._planFerieMbr(marie, 4, 17), null);
vaut('férié : pour un moins de 18 ans dispensé, ça reste un férié', !!F._planFerieMbr(paul, 4, 17), true);
vaut('férié : Marie compte 7 h de travail + 8 h 30 du férié', F._planCompteH(marie, 'equipe', 4, 17, undefined, AN), 15.5);
vaut('férié : le dispensé compte le seul férié', F._planCompteH(paul, 'equipe', 4, 17, undefined, AN), 8.5);
vaut('férié : le modèle tombe sur sa base attendue (1 834 h)', Math.round((F._planModelBrut('equipe', AN) - F._planBaseAttendue('equipe', AN)) * 100) / 100, 0);
window.CONFIG = { solidarite: { [AN]: { mode: 'jour', jour: '06-05' } } };
vaut('un autre jour : le samedi 5 juin reçoit 7 h', F._planPlanned('equipe', 5, 5, AN), 7);
vaut('un autre jour : le modèle tombe juste, sans retouche', Math.round((F._planModelBrut('equipe', AN) - F._planBaseAttendue('equipe', AN)) * 100) / 100, 0);
window.CONFIG = { solidarite: { [AN]: { mode: 'ferie', jour: '05-17', dispenses: { Marie: 'ailleurs' } } } };
vaut('déjà faite chez un autre employeur : dispensée, quel que soit le choix', F._planSolidFait(marie, AN), false);
window.CONFIG = { solidarite: { [AN]: { mode: 'offerte' } } };
vaut('offerte : personne ne la doit', F._planSolidFait(marie, AN), false);
vaut('offerte : la base attendue reste 1 827 h', F._planBaseAttendue('equipe', AN), 1827);
vaut('un férié travaillé (hors solidarité) ne compte que son travail', F._planCompteH(marie, 'equipe', 6, 14, { h: 8 }, AN), 8);

console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
