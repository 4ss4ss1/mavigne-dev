/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — MODELES-1 (§536) : LES MODÈLES DE SEMAINE SE COMPTENT EN MODÈLES, PAS EN CLÉS
   Lancer : node scripts/mv-harnais-modeles1.mjs          (le contrôle)
            node scripts/mv-harnais-modeles1.mjs --contre  (chaque défaut reposé doit rougir)
   Vécu le 06/11 chez un client : ses modèles étaient encore rangés à l'ANCIENNE forme (cinq modèles à plat,
   sans année). À l'ouverture du Planning, _planMigrateYears (planning.js) les range en mémoire sous 2026 :
   une clé au lieu de cinq. La garde comptait les CLÉS — « cur=5 new=1 » — et refusait tout enregistrement
   de modèle, à chaque essai. Rien n'était perdu. À l'inverse, sur la forme par année, cinq modèles ramenés
   à un dans la même année laissaient une clé : une vraie perte passait sans un mot.
   Les VRAIES fonctions, extraites des fichiers : la fusion (_mvFusion et ses aides), les compteurs
   (_mvDocSize, _mvModelesCount), les deux chemins de la garde — l'envoi (_mvSauverFusion, transaction
   simulée) et la file / le coffre (_mvBlockDestructive) — et la migration de planning.js.
   Domaine fictif : « standard », « tractoriste », « saisonnier », « cave », « mi-temps ».
   Contre-épreuve : chaque défaut est posé dans une copie de firebase.js HORS du dépôt et joué dans un
   processus à part ; il doit rougir.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const VAR = process.env.MV_MODELES1_VAR || '';
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const sansCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// [ce que le défaut casse, l'ancre exacte dans src/firebase.js, ce qui la remplace]
const DEFAUTS = {
  cles:     ['la garde recompte les clés : des années, pas des modèles',
             "  if (key === 'planning_templates') return _mvModelesCount(val);", ''],
  tiroirs:  ['une année compte pour un seul modèle',
             'Object.keys(an).forEach(function (id) { n++; ranges[id] = 1; });', 'n++;'],
  doublon:  ['un modèle déjà rangé sous une année et resté à plat compte deux fois',
             'anciens.forEach(function (id) { if (!ranges[id]) n++; });', 'anciens.forEach(function (id) { n++; });'],
  plancher: ['plancher remis à 1 : supprimer son dernier modèle est refusé',
             'planning_templates: 2,', 'planning_templates: 1,'],
  annee:    ['la règle « quatre chiffres = une année » n’est plus celle de planning.js',
             'if (/^\\d{4}$/.test(k)) {', 'if (/^20\\d\\d$/.test(k)) {'],
};

if (CONTRE) {
  console.log('\n── MODELES-1 — contre-épreuve (un processus par défaut)\n');
  const src = lire('src/firebase.js');
  let tenues = 0, total = 0;
  for (const [cle, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++;
    const n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-modeles1-')), fp = path.join(tmp, 'firebase.js');
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 120000,
      env: Object.assign({}, process.env, { MV_MODELES1_VAR: cle, MV_MODELES1_FIREBASE: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const vu = r.status !== 0, det = String(r.stdout || '').trim().split('\n').pop();
    if (vu) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.slice(0, 120) + ')' : '')); }
    else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`);
  process.exit(tenues === total ? 0 : 1);
}

/* ══ EXTRACTION — les fonctions telles qu'elles sont écrites ══ */
const FB = process.env.MV_MODELES1_FIREBASE ? fs.readFileSync(process.env.MV_MODELES1_FIREBASE, 'utf8') : lire('src/firebase.js');
const PL = lire('src/planning.js');
function fonction(src, nom, fichier) {
  const m = new RegExp('^(?:export\\s+)?(?:async\\s+)?function ' + nom + '\\s*\\(', 'm').exec(src);
  if (!m) throw new Error('ABSENTE de ' + fichier + ' : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(m.index, j + 1);
  }
  throw new Error('accolade non fermée : ' + nom);
}
function blocVar(src, nom, fichier) {
  const m = new RegExp('^var ' + nom + '\\s*=[^;]*;', 'm').exec(src);
  if (!m) throw new Error('VAR ABSENTE de ' + fichier + ' : ' + nom);
  return m[0];
}
const FNS = ['_mvIsObj', '_mvEgal', '_mvCanon', '_mvFusion', '_mvFusionObjet', '_mvIdentite', '_mvClesListes', '_mvFusionListe',
  '_entryHasProg', '_tachesBlockHasProg', '_mvParcProgCount', '_mvIntrantsCount', '_mvPaieCount', '_mvModelesCount', '_mvDocSize',
  '_mvBlockDestructive', '_mvSauverFusion'];

/* ══ BAC DE TEST — un serveur en mémoire ══ */
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
let SERVEUR, ECRIT, LOGS = [];
const W = { PLANNING_TEMPLATES: {}, PLANNING_ENTRIES: {}, logError: o => LOGS.push(o), _mvAvale: () => {} };
const snap = v => ({ exists: () => v !== undefined && v !== null, data: () => ({ value: clone(v) }), metadata: {} });
const DEP = {
  window: W, db: {}, MV_LIMITE_DOC: 1048576,
  fbDocRef: k => ({ k }),
  getDoc: async () => snap(SERVEUR),
  runTransaction: async (db, fn) => fn({ get: async () => snap(SERVEUR), set: (ref, d) => { ECRIT = clone(d.value); } }),
  _mvErrLent: () => new Error('lent'),
  _fbClone: (k, v) => clone(v),
  _mvTailleControle: () => 1,
  _mvGardeEcran: () => ({}),
};
let H, ok = 0, ko = 0; const rouges = [];
function t(nom, cond, det) {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; rouges.push(nom.split(' ')[0]); console.log('  \x1b[31m✗\x1b[0m ' + nom + (det !== undefined ? '  → ' + String(det).slice(0, 220) : '')); }
}
async function essai(nom, f, det) {
  let v = false, d;
  try { v = await f(); } catch (e) { d = 'plantage : ' + (e && e.message); }
  if (!v && d === undefined && det) { try { d = await det(); } catch (e) { d = 'plantage : ' + (e && e.message); } }
  t(nom, !!v, d);
}
try {
  const code = [blocVar(FB, '_MV_GUARD_FLOORS', 'src/firebase.js'), ...FNS.map(n => fonction(FB, n, 'src/firebase.js')),
    blocVar(PL, '_MV_PLAN_BASE_YEAR', 'src/planning.js'), 'var PLANNING_ENTRIES = {}, PLANNING_TEMPLATES = {};',
    fonction(PL, '_planMigrateYears', 'src/planning.js'),
    'return { _mvDocSize, _MV_GUARD_FLOORS, _mvBlockDestructive, _mvSauverFusion, _planMigrateYears };'].join('\n');
  H = new Function(...Object.keys(DEP), code)(...Object.values(DEP));
} catch (e) {
  console.log('  \x1b[31m✗\x1b[0m extraction impossible : ' + e.message);
  if (VAR) console.log('rouges : extraction');
  process.exit(1);
}

const MOD = () => ({ 0: { 5: 7, 6: 7 }, 3: { 1: 8 }, _timings: { 3: { d: '07:30', f: '16:30', continu: false } } });   // [mois][jour] → heures
const NOMS = ['standard', 'tractoriste', 'saisonnier', 'cave', 'mi-temps'];
const plat = n => Object.fromEntries(NOMS.slice(0, n).map(k => [k, MOD()]));
const parAn = (an, noms) => ({ [an]: Object.fromEntries(noms.map(k => [k, MOD()])) });
const compte = v => H._mvDocSize('planning_templates', v);
// La mémoire du téléphone : ce que _planMigrateYears fait de ce qu'il a reçu (en place, comme dans l'appli).
function migrer(v) { const o = clone(v); W.PLANNING_TEMPLATES = o; W.PLANNING_ENTRIES = {}; H._planMigrateYears(); return o; }
// Un enregistrement par l'envoi (fbSave → _mvSauverFusion) : la base = ce que le téléphone a lu du serveur.
async function envoi(serveur, base, local) {
  SERVEUR = clone(serveur); ECRIT = undefined;
  const r = await H._mvSauverFusion('planning_templates', clone(local), clone(base), null);
  return { bloque: !!(r && r.bloque), cur: r && r.curN, nouv: r && r.newN, ecrit: ECRIT };
}
// Un enregistrement repris de la file ou du coffre (_mvBlockDestructive : lecture puis décision).
async function file(serveur, local) { SERVEUR = clone(serveur); LOGS = []; return { bloque: await H._mvBlockDestructive('planning_templates', clone(local)), logs: LOGS.slice() }; }
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log('\n── MODELES-1 — la garde compte les modèles de semaine\n');

// ── A. Le compte ──
await essai('A1 ancienne forme, cinq modèles à plat : 5', () => compte(plat(5)) === 5, () => compte(plat(5)));
await essai('A2 rangés par année (3 en 2026, 2 en 2027) : 5', () => compte({ 2026: { a: MOD(), b: MOD(), c: MOD() }, 2027: { a: MOD(), b: MOD() } }) === 5);
await essai('A3 forme mêlée : un modèle déjà rangé et resté à plat ne compte qu’une fois (3)',
  () => compte({ 2026: { standard: MOD(), cave: MOD() }, standard: MOD(), tractoriste: MOD() }) === 3,
  () => compte({ 2026: { standard: MOD(), cave: MOD() }, standard: MOD(), tractoriste: MOD() }));
await essai('A4 une année vide, un document vide ou absent : 0', () => compte({ 2026: {} }) === 0 && compte({}) === 0 && compte(null) === 0 && compte(undefined) === 0);
await essai('A5 les autres documents se comptent comme avant', () => H._mvDocSize('traitements', [1, 2, 3]) === 3 && H._mvDocSize('config', { a: 1, b: 2 }) === 2
  && H._mvDocSize('planning_entries', { Jean: { 2026: {} }, Marie: { 2026: {} } }) === 2);

// ── B. Le cas vécu : l'ancienne forme, rangée par année en mémoire ──
const SRV5 = plat(5), MIG5 = migrer(SRV5);
await essai('B1 le téléphone range les cinq modèles sous 2026 (une clé, cinq modèles, le contenu intact)',
  () => egal(Object.keys(MIG5), ['2026']) && NOMS.every(k => egal(MIG5[2026][k], MOD())), () => JSON.stringify(Object.keys(MIG5)));
let r = await envoi(SRV5, SRV5, Object.assign(clone(MIG5), { 2026: Object.assign(clone(MIG5[2026]), { vendanges: MOD() }) }));
await essai('B2 créer un modèle après le rangement : enregistré (avant : « cur=5 new=1 », refusé)', () => !r.bloque && r.ecrit !== undefined, () => JSON.stringify(r).slice(0, 200));
await essai('B3 … et le serveur reçoit la forme par année : les cinq modèles intacts, plus le nouveau, plus rien à plat',
  () => egal(Object.keys(r.ecrit || {}), ['2026']) && Object.keys(r.ecrit[2026]).length === 6 && NOMS.every(k => egal(r.ecrit[2026][k], MOD())),
  () => JSON.stringify(Object.keys(r.ecrit || {})));
r = await envoi(SRV5, SRV5, MIG5);
await essai('B4 enregistrer sans rien changer après le rangement : passe', () => !r.bloque, () => JSON.stringify(r).slice(0, 200));
const f1 = await file(SRV5, MIG5);
await essai('B5 la même saisie reprise de la file ou du coffre : passe, aucune alerte critique', () => f1.bloque === false && !f1.logs.some(l => l && l.cat === 'guard'), () => JSON.stringify(f1));
r = await envoi(plat(3), plat(3), migrer(plat(3)));
const r2 = await envoi(plat(2), plat(2), migrer(plat(2)));
await essai('B6 trois modèles à plat (refusé avant), deux : passent', () => !r.bloque && !r2.bloque, () => JSON.stringify([r.cur, r.nouv, r2.cur, r2.nouv]));
await essai('B7 le lendemain, sur la forme par année : supprimer un modèle passe', async () => {
  const a = await envoi(SRV5, SRV5, MIG5); if (!a.ecrit) return false;   // le premier enregistrement a rangé le serveur
  const moins = clone(a.ecrit); delete moins[2026].cave;
  const b = await envoi(a.ecrit, a.ecrit, moins);
  return !b.bloque && Object.keys(b.ecrit[2026]).length === 4;
});

// ── C. Une vraie perte reste refusée — et se voit maintenant dans une année ──
const AN5 = parAn(2026, NOMS);
r = await envoi(AN5, AN5, parAn(2026, ['standard']));
await essai('C1 cinq modèles ramenés à un dans la même année : refusé (avant : passait, une clé de chaque côté)',
  () => r.bloque && r.cur === 5 && r.nouv === 1 && r.ecrit === undefined, () => JSON.stringify(r).slice(0, 200));
r = await envoi(AN5, AN5, { 2026: {} });
await essai('C2 l’année vidée d’un coup : refusé', () => r.bloque && r.ecrit === undefined, () => JSON.stringify(r).slice(0, 200));
r = await envoi(SRV5, SRV5, {});
await essai('C3 l’ancienne forme écrasée par un document vide : refusé', () => r.bloque && r.ecrit === undefined, () => JSON.stringify(r).slice(0, 200));
r = await envoi(SRV5, SRV5, { 2026: {} });
await essai('C4 l’ancienne forme écrasée par une année vide (celle que _pTplStore crée en lisant) : refusé', () => r.bloque && r.ecrit === undefined, () => JSON.stringify(r).slice(0, 200));
const f2 = await file(AN5, parAn(2026, ['standard']));
await essai('C5 la perte reprise de la file : refusée, et l’alerte dit « cur=5 new=1 »',
  () => f2.bloque === true && f2.logs.some(l => l && l.cat === 'guard' && /cur=5 new=1/.test(String(l.detail))), () => JSON.stringify(f2).slice(0, 200));

// ── D. Supprimer à la main, un modèle à la fois, jusqu'au dernier ──
let srv = clone(AN5), chaine = [];
for (const nom of NOMS) {
  const loc = clone(srv); delete loc[2026][nom];
  const e = await envoi(srv, srv, loc);
  chaine.push(compte(srv) + '→' + compte(loc) + (e.bloque ? ' REFUSÉ' : ''));
  if (!e.bloque) srv = e.ecrit;
}
await essai('D1 5 → 4 → 3 → 2 → 1 → 0, un à la fois : tout passe (le dernier aussi)', () => !chaine.some(c => /REFUSÉ/.test(c)) && compte(srv) === 0, () => chaine.join(' · '));
const mig4 = clone(MIG5); delete mig4[2026].cave;
r = await envoi(SRV5, SRV5, mig4);
await essai('D2 supprimer un modèle juste après le rangement (5 à plat → 4 sous 2026) : passe', () => !r.bloque, () => JSON.stringify(r).slice(0, 200));
const MELE = { 2026: { standard: MOD(), tractoriste: MOD(), saisonnier: MOD() }, standard: MOD(), tractoriste: MOD(), saisonnier: MOD() };
const MIGM = migrer(MELE);
r = await envoi(MELE, MELE, MIGM);
const mm = clone(MIGM); delete mm[2026].saisonnier;
const r3 = await envoi(MELE, MELE, mm);
await essai('D3 forme mêlée (trois rangés, les trois restés à plat) : le rangement passe, puis une suppression passe',
  () => !r.bloque && !r3.bloque, () => JSON.stringify([r.cur, r.nouv, r3.cur, r3.nouv]));

// ── E. Ce qui ne se joue pas ici : lu dans les fichiers (commentaires retirés) ──
const FBN = sansCom(FB), PLN = sansCom(PL);
const regleFb = (fonction(FBN, '_mvModelesCount', 'src/firebase.js').match(/\/\^[^/\n]*\$\/\.test\(k\)/) || [])[0];
const reglePl = (fonction(PLN, '_planMigrateYears', 'src/planning.js').match(/\/\^[^/\n]*\$\/\.test\(k\)/) || [])[0];
t('E1 « quatre chiffres = une année » : la même règle dans la garde et dans la migration', !!regleFb && regleFb === reglePl, regleFb + ' / ' + reglePl);
const excl = (FBN.match(/var _MV_FUSION_EXCLUES\s*=\s*\{[^}]*\}/) || [''])[0];
t('E2 planning_templates passe par la fusion de l’envoi (absent de _MV_FUSION_EXCLUES)', !!excl && !/planning_templates/.test(excl), excl);
t('E3 le coffre renvoie par fbSave, donc repasse par la garde (mvStashResend)', /window\.mvStashResend\s*=\s*function[\s\S]{0,400}window\.fbSave\(cle,\s*e\.value\)/.test(FBN));

if (VAR) { console.log('rouges : ' + (rouges.join(' · ') || 'aucun')); process.exit(ko ? 1 : 0); }
console.log(`\n  ${ok} vertes, ${ko} rouges\n`);
process.exit(ko ? 1 : 0);
