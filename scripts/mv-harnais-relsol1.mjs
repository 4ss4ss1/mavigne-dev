/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — RELSOL-1 (§547) : LA JOURNÉE DE SOLIDARITÉ AU RELEVÉ DU MOIS
   Lancer : node scripts/mv-harnais-relsol1.mjs          (le contrôle)
            node scripts/mv-harnais-relsol1.mjs --contre  (chaque défaut reposé doit rougir)
   Les VRAIES fonctions (src/planning.js), sur 2027. Lu à la main avant le premier passage : le lundi de Pentecôte
   (17 mai 2027) travaillé → au relevé de mai seulement, « le lundi 17 mai, non rémunérée », 7 h ; un autre jour (le
   samedi 5 juin) → en juin ; étalée → en décembre seulement, 7 h ; offerte → en décembre, « offerte » ; un salarié déjà
   passé par un autre employeur → « dispensé » le mois du jour ; un TESA, payé à l'heure → rien ; 2026 (avant la base) → rien.
   Et dans le code : la ligne va « pour le salarié » (rien ne change la paie), à l'écran comme sur le papier (_pfCompta).
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const DEFAUTS = {
  etalee:  ['l’étalée revient chaque mois', "  if(s.mode==='etalee')return m===11?", "  if(s.mode==='etalee')return true?"],
  mois:    ['le férié travaillé sort le mois d’après', '  if(!j||j.m!==m)return null;', '  if(!j||j.m+1!==m)return null;'],
  dispense:['un dispensé reçoit ses 7 h', "  if(!_planSolidFait(mbr,yr)){var d=", "  if(false){var d="],
};
if (CONTRE) {
  console.log('\n── RELSOL-1 — contre-épreuve (un processus par défaut)\n');
  const src = lire('src/planning.js'); let tenues = 0, total = 0;
  for (const [cle, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-relsol1-')), fp = path.join(tmp, 'planning.js');
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 60000, env: Object.assign({}, process.env, { MV_RELSOL1_PLANNING: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const vu = r.status !== 0, det = String(r.stdout || '').split('\n').filter(l => l.includes('✗'))[0] || '';
    if (vu) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.trim().slice(0, 100) + ')' : '')); } else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`);
  process.exit(tenues === total ? 0 : 1);
}
const PL = process.env.MV_RELSOL1_PLANNING ? fs.readFileSync(process.env.MV_RELSOL1_PLANNING, 'utf8') : lire('src/planning.js');
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades : ' + nom);
}
const NOMS = ['_mvEasterMD', '_feriesY', '_planBaseActive', '_planJoursSem', '_planBaseAn', '_planSolid', '_planSolidCle', '_planSolidFait', '_planSolidJour', '_planEstSolid', '_planSolidRatio', '_planCreditFerie', '_planRelSolidarite'];
const MODES = /var PLAN_SOLID_MODES=\{[^;]*\};/.exec(PL)[0];
const ctx = vm.createContext({ window: { CONFIG: {}, _mvAnnualise: m => m.type_contrat !== 'TESA' }, _MV_FERIES_CACHE: {}, _an: 2027,
  PLAN_MOIS: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'] });
ctx._planGetTpl = () => { const t = {}; for (let m = 0; m < 12; m++) { t[m] = {}; for (let d = 1; d <= 28; d++) t[m][d] = 7; } return t; };   // un temps plein
vm.runInContext(MODES + '\nfunction _pY(){return _an;}\nfunction _planFmt(h){return String(h)+" h";}\nfunction _planPlId(m){return "equipe";}\n'
  + NOMS.map(n => fonction(PL, n)).join('\n') + '\nthis.rel=_planRelSolidarite;', ctx);
const marie = { nom: 'Marie', type_contrat: 'CDI' }, paul = { nom: 'Paul', type_contrat: 'CDI' }, leo = { nom: 'Léo', type_contrat: 'TESA' };
let verts = 0; const ECHECS = [];
function vaut(quoi, obtenu, attendu) { const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' → ' + JSON.stringify(obtenu)); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' → ' + JSON.stringify(obtenu) + ' (attendu ' + JSON.stringify(attendu) + ')'); } }
const mois = mbr => [...Array(12).keys()].filter(m => ctx.rel(mbr, m));
console.log('\n── RELSOL-1 — la journée de solidarité au relevé, 2027\n');
ctx.window.CONFIG = { solidarite: { 2027: { mode: 'ferie', jour: '05-17', dispenses: { Paul: 'ailleurs' } } } };
vaut('le lundi de Pentecôte travaillé : au relevé de mai seulement', mois(marie), [4]);
vaut('… « le lundi 17 mai, non rémunérée », 7 h', ctx.rel(marie, 4), { v: '7 h', p: 'le lundi 17 mai, non rémunérée' });
vaut('un salarié déjà passé par un autre employeur : « dispensé », en mai', [mois(paul), ctx.rel(paul, 4).v], [[4], 'dispensé']);
vaut('un TESA, payé à l’heure : rien', mois(leo), []);
ctx.window.CONFIG = { solidarite: { 2027: { mode: 'jour', jour: '06-05' } } };
vaut('un autre jour (le samedi 5 juin) : en juin', [mois(marie), ctx.rel(marie, 5).p], [[5], 'le samedi 5 juin, non rémunérée']);
ctx.window.CONFIG = { solidarite: { 2027: { mode: 'etalee' } } };
vaut('étalée : en décembre seulement, 7 h', [mois(marie), ctx.rel(marie, 11)], [[11], { v: '7 h', p: 'étalée sur l’année, non rémunérée' }]);
ctx.window.CONFIG = { solidarite: { 2027: { mode: 'offerte' } } };
vaut('offerte : en décembre, « offerte »', [mois(marie), ctx.rel(marie, 11).v], [[11], 'offerte']);
ctx._an = 2026; ctx.window.CONFIG = { solidarite: { 2026: { mode: 'etalee' } } };
vaut('2026, avant la base de l’année : rien', mois(marie), []);
console.log('\n── la ligne, à l’écran et sur le papier\n');
const cpt = fonction(PL, '_pfCompta');
vaut('elle va « pour le salarié » (rien ne change la paie), depuis _pfCompta que lisent l’écran et le papier', /var sol=_planRelSolidarite\(mbr,m\);/.test(cpt) && /if\(sol\)I\.push\(\[/.test(cpt), true);
console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
