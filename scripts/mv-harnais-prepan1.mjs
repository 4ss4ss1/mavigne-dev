/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — PREPAN-1 (§559) : UNE ANNÉE SANS MODÈLE PART DU MODÈLE DU DOMAINE DE L'ANNÉE D'AVANT (D3)
   Lancer : node scripts/mv-harnais-prepan1.mjs          (le contrôle)
            node scripts/mv-harnais-prepan1.mjs --contre  (chaque défaut reposé doit rougir)
   Décision D3 (maquette « modèles suivis » v1, validée le 09/11) : le modèle ENREGISTRÉ le plus récent d'une année d'avant,
   replacé sur les jours de l'année (un lundi reste un lundi) ; le modèle intégré seulement quand le domaine n'a ce modèle sur
   aucune année d'avant. Les VRAIES fonctions de planning.js (le recalage, le modèle intégré, la source, le report, _planGetTpl,
   l'état du report et sa phrase, le bandeau du mois, la liste des modèles), sur le vrai modèle intégré. Domaine fictif : un
   modèle « arthur » (lundi → mercredi 8 h, jeudi 4 h, vendredi repos) et un « standard » à soi, enregistrés sur 2026.
   Contre-épreuve : chaque défaut est posé dans une copie de planning.js HORS du dépôt et joué dans un processus à part.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const DEFAUTS = {
  source:  ['une année sans modèle sert encore le modèle intégré', 'return _planTplReport(plId,_Y).g;', 'return _planTplDef(plId,_Y);'],
  apres:   ['une année d’après sert une année d’avant', 'if(y<yr&&st&&st[plId]&&(best===null||y>best))best=y;', 'if(y!==yr&&st&&st[plId]&&(best===null||y>best))best=y;'],
  cache:   ['le report ne voit pas un modèle remplacé', 'if(!c||c.ref!==s.g||c.an!==s.an){', 'if(!c){'],
  bandeau: ['le bandeau dit encore « report du modèle 2026 »', "'<span>La grille de '+Y+' reprend '+_planRecaleSourceTxt(et)+'</span>'", "'<span>La grille de '+Y+' est un report du mod\\u00e8le '+PLAN_DEF_AN+'</span>'"],
  liste:   ['la liste des modèles de 2027 oublie ceux de 2026', 'if(y<Y&&PLANNING_TEMPLATES[k])Object.assign(o,PLANNING_TEMPLATES[k]);', ''],
  etat:    ['l’état prend le modèle intégré pour un modèle du domaine', 'if(inf.src!=null){ans[inf.src]=1;nd++;} else integre=true;', 'ans[inf.src||2026]=1;nd++;'],
};
if (process.argv.includes('--contre')) {
  console.log('\n── PREPAN-1 — contre-épreuve (un processus par défaut)\n');
  const src = fs.readFileSync(path.join(R, 'src/planning.js'), 'utf8'); let tenues = 0, total = 0;
  for (const [, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-pp1-')), fp = path.join(tmp, 'planning.js');
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 60000, env: Object.assign({}, process.env, { MV_PP1_PL: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const det = String(r.stdout || '').split('\n').filter(l => l.includes('✗'))[0] || '';
    if (r.status !== 0) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.replace(/\x1b\[[0-9;]*m/g, '').trim().slice(0, 100) + ')' : '')); }
    else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`); process.exit(tenues === total ? 0 : 1);
}
const PL = fs.readFileSync(process.env.MV_PP1_PL || path.join(R, 'src/planning.js'), 'utf8');
function fonction(src, nom) {
  const m = new RegExp('^function ' + nom + '\\s*\\(', 'm').exec(src); if (!m) throw new Error('ABSENTE : ' + nom);
  const i = src.indexOf('{', m.index); let d = 0;
  for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) return src.slice(m.index, j + 1); } }
  throw new Error('accolades : ' + nom);
}
let verts = 0; const ECHECS = [];
function T(ok, quoi, det) { if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + (det !== undefined ? ' — ' + String(det).slice(0, 220) : '')); } }
let F, ctx;
try {
  const i0 = PL.indexOf('var PLAN_DEF = {'), j0 = PL.indexOf('\n};', i0);
  const NOMS = ['_planRecaleMap', '_planRecale', '_planTplDef', '_planTplDefInfo', '_planTplSource', '_planTplReport', '_planGetTpl', '_planRecaleEtat', '_planRecaleSourceTxt', '_planModeles', '_pTplStore', '_planRecaleBar'];
  ctx = vm.createContext({ ANNEE: 2027, ADM: true, ACTIFS: [] });
  vm.runInContext(PL.slice(i0, j0 + 3) + '\nvar PLAN_DEF_AN=2026, _PLAN_RECALE_CACHE={}, _PLAN_REPORT_CACHE={}, PLANNING_TEMPLATES={};\n'
    + 'function _pY(){return ANNEE;}\nfunction isAdmin(){return ADM;}\nfunction _pl2Actifs(){return ACTIFS;}\nfunction _planPlId(m){return m.planning_id||"standard";}\n'
    + 'function _mvIcon(){return "";}\nfunction _escHtml(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}\n'
    + NOMS.map(n => fonction(PL, n)).join('\n') + '\nthis.f={' + NOMS.join(',') + '};this.T=function(v){PLANNING_TEMPLATES=v;};this.PLAN_DEF=PLAN_DEF;', ctx);
  F = ctx.f;
} catch (e) { console.log('  \x1b[31m✗\x1b[0m extraction impossible : ' + e.message); process.exit(1); }
const RealDate = Date;
const grille = (yr, f) => { const o = {}; for (let m = 0; m < 12; m++) { o[m] = {}; const nb = new RealDate(yr, m + 1, 0).getDate(); for (let d = 1; d <= nb; d++) { const v = f(new RealDate(yr, m, d).getDay(), m, d); if (v > 0) o[m][d] = v; } } return o; };
const ART26 = grille(2026, g => (g >= 1 && g <= 3 ? 8 : (g === 4 ? 4 : 0)));
const STD26 = grille(2026, g => (g >= 1 && g <= 5 ? 7.5 : 0));
const jourSem = (G, yr, g) => { const vals = new Set(); for (let m = 0; m < 12; m++) for (const d in G[m] || {}) if (new RealDate(yr, m, +d).getDay() === g) vals.add(G[m][d]); return [...vals]; };

console.log('\n── PREPAN-1 — une année sans modèle part du modèle du domaine de l’année d’avant\n');
ctx.T({ 2026: { arthur: ART26, standard: STD26 } });
// ── A. Le modèle du domaine de 2026 sert 2027, replacé ──
const A27 = F._planGetTpl('arthur', 2027), rA = F._planTplReport('arthur', 2027);
T(rA.src === 2026, 'A1 « arthur » absent de 2027 : la source est le « arthur » 2026 du domaine', rA.src);
T(JSON.stringify(jourSem(A27, 2027, 5)) === '[]' && JSON.stringify(jourSem(A27, 2027, 4)) === '[4]' && JSON.stringify(jourSem(A27, 2027, 1)) === '[8]', 'A2 replacé : en 2027, le vendredi reste au repos, le jeudi à 4 h, le lundi à 8 h (un lundi reste un lundi)', JSON.stringify({ ven: jourSem(A27, 2027, 5), jeu: jourSem(A27, 2027, 4), lun: jourSem(A27, 2027, 1) }));
const DEF27 = F._planTplDef('arthur', 2027);
T(JSON.stringify(A27[0]) !== JSON.stringify(DEF27[0]), 'A3 … et ce n’est plus le modèle intégré');
T(JSON.stringify(F._planGetTpl('standard', 2027)[2]) === JSON.stringify(F._planRecale(STD26, 2026, 2027).g[2]), 'A4 le « standard » à soi du domaine sert aussi, replacé (mars 2027 identique au recalage de 2026)');
// ── B. Un modèle enregistré pour l'année n'est jamais touché ──
const ART27 = grille(2027, g => (g === 2 ? 6 : 0)); ctx.T({ 2026: { arthur: ART26 }, 2027: { arthur: ART27 } });
T(F._planGetTpl('arthur', 2027) === ART27, 'B1 « arthur » enregistré pour 2027 : servi tel quel (le même objet)');
// ── C. Sans aucun modèle du domaine : le modèle intégré, comme avant ──
ctx.T({ 2026: { arthur: ART26 } });
const rS = F._planTplReport('saisonnier', 2027);
T(rS.src === null && JSON.stringify(F._planGetTpl('saisonnier', 2027)) === JSON.stringify(F._planTplDef('saisonnier', 2027)), 'C1 un modèle que le domaine n’a sur aucune année : le modèle intégré recalé (src null)');
T(F._planGetTpl('standard', 2026) === ctx.PLAN_DEF.standard, 'C2 « standard » jamais enregistré, sur 2026 : le modèle intégré tel quel');
// ── D. Le plus récent d'avant, même de deux ans ──
const ART25 = grille(2025, g => (g === 1 ? 9 : 0)); ctx.T({ 2025: { arthur: ART25 } });
T(F._planTplReport('arthur', 2027).src === 2025 && JSON.stringify(jourSem(F._planGetTpl('arthur', 2027), 2027, 1)) === '[9]', 'D1 « arthur » sur 2025 seulement : 2027 part de 2025, replacé', F._planTplReport('arthur', 2027).src);
ctx.T({ 2025: { arthur: ART25 }, 2026: { arthur: ART26 } });
T(F._planTplReport('arthur', 2027).src === 2026, 'D2 2025 et 2026 : le plus récent, 2026');
// ── E. Une année d'après ne sert jamais une année d'avant ──
ctx.T({ 2028: { arthur: ART26 } });
T(F._planTplReport('arthur', 2027).src === null, 'E1 « arthur » sur 2028 seulement : 2027 reste au modèle intégré');
// ── F. Le report suit un modèle remplacé ──
ctx.T({ 2026: { arthur: ART26 } });
const g1 = F._planGetTpl('arthur', 2027), g2 = F._planGetTpl('arthur', 2027);
T(g1 === g2, 'F1 deux lectures du même modèle : le même report (mémorisé)');
const ART26b = grille(2026, g => (g === 5 ? 3 : 0)); ctx.T({ 2026: { arthur: ART26b } });
T(JSON.stringify(jourSem(F._planGetTpl('arthur', 2027), 2027, 5)) === '[3]', 'F2 le modèle 2026 remplacé : 2027 suit (vendredi 3 h)', JSON.stringify(jourSem(F._planGetTpl('arthur', 2027), 2027, 5)));
// ── G. L'état du report dit la source ──
ctx.T({ 2026: { arthur: ART26, standard: STD26 } });
const et = F._planRecaleEtat(2027, ['arthur', 'saisonnier']);
T(!!et && JSON.stringify(et.ans) === '[2026]' && et.integre === true, 'G1 « arthur » (2026) et « saisonnier » (aucun) : la source dite — 2026, et l’intégré', JSON.stringify(et));
T(F._planRecaleSourceTxt(et) === 'votre mod\u00e8le 2026 et le mod\u00e8le int\u00e9gr\u00e9 de l\u2019appli', 'G2 la phrase : « votre modèle 2026 et le modèle intégré de l’appli » (un seul modèle du domaine)', F._planRecaleSourceTxt(et));
const et2 = F._planRecaleEtat(2027, ['arthur', 'standard']);
T(F._planRecaleSourceTxt(et2) === 'vos mod\u00e8les 2026', 'G2b deux modèles du domaine : « vos modèles 2026 »', F._planRecaleSourceTxt(et2));
T(et.trous === et.perdus + et.vides && et.trous > 0, 'G3 les jours à poser sont comptés (' + (et && et.trous) + ')');
T(F._planRecaleEtat(2026, ['saisonnier']) === null, 'G4 sur 2026 sans modèle du domaine : l’intégré est calé, rien à dire');
ctx.T({ 2025: { arthur: ART25 } });
const et26 = F._planRecaleEtat(2026, ['arthur']);
T(!!et26 && JSON.stringify(et26.ans) === '[2025]' && !et26.integre, 'G5 sur 2026 avec un « arthur » 2025 : le report se dit (2025), même sur l’année du modèle intégré', JSON.stringify(et26));
// ── H. Le bandeau du mois dit vrai ──
ctx.T({ 2026: { arthur: ART26 } }); ctx.ANNEE = 2027; ctx.ACTIFS = [{ planning_id: 'arthur' }];
const B = F._planRecaleBar();
T(/La grille de 2027 reprend votre mod\u00e8le 2026/.test(B) && !/report du mod/.test(B), 'H1 le bandeau : « La grille de 2027 reprend votre modèle 2026 »', B.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 160));
ctx.T({}); ctx.ACTIFS = [{ planning_id: 'saisonnier' }];
const B2 = F._planRecaleBar();
T(/La grille de 2027 reprend le mod\u00e8le int\u00e9gr\u00e9 de l\u2019appli/.test(B2), 'H2 sans modèle du domaine : « … reprend le modèle intégré de l’appli »', B2.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 160));
ctx.ADM = false;
T(F._planRecaleBar() === '', 'H3 pas de bandeau pour qui n’est pas administrateur'); ctx.ADM = true;
// ── I. La liste des modèles d'une année ──
ctx.T({ 2026: { arthur: ART26 }, 2027: { equipe: ART27 }, 2028: { futur: ART26 } }); ctx.ANNEE = 2027;
const L = F._planModeles();
T(L.includes('arthur') && L.includes('equipe') && L.includes('standard') && !L.includes('futur'), 'I1 la liste de 2027 : « arthur » (repris de 2026), « equipe » (2027), les intégrés — pas « futur » (2028)', JSON.stringify(L));
// ── J. Le document imprimé dit la même source ──
T(/'Le document reprend '\+_planRecaleSourceTxt\(_et\)/.test(PL), 'J1 le planning imprimé prend la même phrase (_planRecaleSourceTxt)');

console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
