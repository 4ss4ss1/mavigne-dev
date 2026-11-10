/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — FERIES-1 (§556) : LES FÉRIÉS DU MODÈLE — VUS, CHÔMÉS OU TRAVAILLÉS D'UN GESTE, DANS L'ONGLET ANNÉE
   Lancer : node scripts/mv-harnais-feries1.mjs          (le contrôle)
            node scripts/mv-harnais-feries1.mjs --contre  (chaque défaut reposé doit rougir)
   Maquette « modèles suivis » v1, point 4 ; décision D2 (09/11) : un férié qui porte des heures est PROPOSÉ chômé, un geste.
   Les VRAIES fonctions de planning.js et planning-annee.js (la lecture de la frise, le brouillon, la section des fériés, la ligne
   de la semaine, les gestes), sur la vraie grille 2026 du modèle intégré, à laquelle on ajoute des heures quatre jours fériés
   (lundi de Pâques, lundi de Pentecôte, 14 juillet, 11 novembre — le cas d'un modèle importé). Stub : la journée de solidarité.
   Contre-épreuve : chaque défaut est posé dans une copie des sources HORS du dépôt et joué dans un processus à part.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const SOURCES = () => lire('src/planning.js') + '\n' + lire('src/planning-annee.js');
const DEFAUTS = {
  solid:    ['la journée de solidarité compte parmi les fériés à chômer', 'P=F.filter(function(f){return f.h>0&&!f.sol;})', 'P=F.filter(function(f){return f.h>0;})'],
  tous:     ['« Chômer les N » n’écrit rien au brouillon', "if(f.h>0&&!f.sol){_planAnneePose(G,f.m,f.d,0);n++;}", 'if(f.h>0&&!f.sol){n++;}'],
  remet:    ['« Travailler » remet 0 au lieu des heures de la saison', '_planAnneePose(G,m,j,f.saison);', '_planAnneePose(G,m,j,0);'],
  semaine:  ['la semaine ne montre plus les heures d’un férié', "+(x.fer?_planAnneeFerieSem(x,A,yr,JN[x.g],adm)", "+(x.fer?'<span>'+_escHtml(x.fer)+'</span>'"],
  base:     ['le texte dit l’année d’avant même quand la base est active', "+(_planBaseActive(yr)?'Ch\\u00f4m\\u00e9, un f\\u00e9ri\\u00e9 compte quand", "+(false?'Ch\\u00f4m\\u00e9, un f\\u00e9ri\\u00e9 compte quand"],
  droits:   ['« Chômer les N » s’offre à qui n’est pas administrateur', "+(adm?'<div style=\"margin-top:8px\"><button class=\"plan-btn-saisir\" data-tuto=\"plan.annee.feries.tous\"", "+(true?'<div style=\"margin-top:8px\"><button class=\"plan-btn-saisir\" data-tuto=\"plan.annee.feries.tous\""],
};
if (process.argv.includes('--contre')) {
  console.log('\n── FERIES-1 — contre-épreuve (un processus par défaut)\n');
  const src = SOURCES(); let tenues = 0, total = 0;
  for (const [, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-fer1-')), fp = path.join(tmp, 'sources.js');
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 120000, env: Object.assign({}, process.env, { MV_FER1_SOURCES: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const det = String(r.stdout || '').split('\n').filter(l => l.includes('✗'))[0] || '';
    if (r.status !== 0) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.replace(/\x1b\[[0-9;]*m/g, '').trim().slice(0, 100) + ')' : '')); }
    else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`); process.exit(tenues === total ? 0 : 1);
}
const PL = process.env.MV_FER1_SOURCES ? fs.readFileSync(process.env.MV_FER1_SOURCES, 'utf8') : SOURCES();
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
  const i0 = PL.indexOf('var PLAN_DEF = {'), j0 = PL.indexOf('};', i0);
  const PLAN_DEF = vm.runInNewContext('(' + PL.slice(i0 + 15, j0 + 1) + ')');
  const NOMS = ['_mvEasterMD', '_feriesY', '_planBaseActive', '_planCreditFerie', '_planAnneeSaison', '_planAnneeLire', '_planAnneeCopie', '_planAnneePose', '_planAnneePasVal', '_planAnneeReguliers',
    '_planAnneeBrouillon', '_planAnneeGrille', '_planAnneeCleS', '_planAnneeDate', '_planAnneePlage', '_planAnneeHoraireTxt', '_paH',
    '_planAnneeFeries', '_planAnneeFerieDate', '_planAnneeFerieSem', '_planAnneeFeriesBloc', 'planAnneeFerie', 'planAnneeFeriesChomer'];
  ctx = vm.createContext({ window: { CONFIG: {}, PLAN_MOIS: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'], showToast: () => {} }, _MV_FERIES_CACHE: {},
    PLAN_MOIS_FR: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    _escHtml: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'), ADM: true, SOLID: null, RENDUS: 0 });
  ctx.isAdmin = () => ctx.ADM;
  // le modèle : la vraie grille 2026, et des heures quatre jours fériés (un modèle importé)
  const G0 = JSON.parse(JSON.stringify(PLAN_DEF.standard)); G0[3][6] = 7; G0[4][25] = 7; G0[6][14] = 7; G0[10][11] = 7;
  ctx.G0 = G0; ctx.PLAN_STD = PLAN_DEF.standard;
  ctx._planGetTpl = () => ctx.MODELE;
  vm.runInContext('var _paEtat=null;function _paE(){return _paEtat;}\nfunction _pY(){return 2026;}\nfunction _planLegal(){return {maxJour:10,hebdoLeg:35,modulMax:250,plafAnnuel:1607};}\n'
    + 'function _planRenderAnnee(){RENDUS++;}\nfunction _planFmt(h){return String(h)+" h";}\nfunction _planSolidJour(){return SOLID;}\nfunction _planSolid(){return null;}\n'
    + NOMS.map(n => fonction(PL, n)).join('\n') + '\nthis.f={' + NOMS.join(',') + '};this.setE=function(v){_paEtat=v;};this.E=function(){return _paEtat;};', ctx);
  F = ctx.f;
} catch (e) { console.log('  \x1b[31m✗\x1b[0m extraction impossible : ' + e.message); process.exit(1); }
const etat = () => { ctx.MODELE = JSON.parse(JSON.stringify(ctx.G0)); ctx.SOLID = null; ctx.ADM = true; ctx.RENDUS = 0; ctx.setE({ annee: 'mi-temps' }); };
const bloc = (yr, adm) => { const E = ctx.E(); return F._planAnneeFeriesBloc(F._planAnneeLire('mi-temps', yr || 2026, E && E.brouillon), 'mi-temps', yr || 2026, adm !== false); };
const btn = (m, j, a) => ({ dataset: { m: String(m), j: String(j), a } });
const jour = (A, m, d) => A.J.find(x => x.m === m && x.d === d);

console.log('\n── FERIES-1 — les fériés du modèle\n');
etat();
// ── A. La section : combien portent des heures, « Chômer les 4 » ──
let H = bloc();
T(/4 f\u00e9ri\u00e9s portent des heures\./.test(H) && /onclick="planAnneeFeriesChomer\(\)">Ch\u00f4mer les 4</.test(H), 'A1 quatre fériés portent des heures : l’encadré le dit, « Chômer les 4 »', H.slice(0, 300));
T(/vaut 0\u00a0h au mod\u00e8le en 2026/.test(H) && /D\u00e8s 2027, un f\u00e9ri\u00e9 ch\u00f4m\u00e9 comptera pour ses heures pr\u00e9vues/.test(H), 'A2 en 2026, le texte : 0 h au modèle cette année, la base dès 2027', (H.match(/mvencadre[\s\S]{0,400}/) || [''])[0]);
T(/mer\.\u00a011\u00a0nov\.<span[^>]*>Armistice<\/span><\/span><b[^>]*>7\u00a0h<\/b><button[^>]*data-a="chomer"/.test(H) && /lun\.\u00a06\u00a0avr\./.test(H), 'A3 chacun : sa date, son nom, ses heures, « Chômer »', (H.match(/mer\.\u00a011[\s\S]{0,260}/) || ['(absent)'])[0]);
T(/15\u00a0ao\u00fbt et 1er\u00a0nov\. tombent un week-end en 2026\./.test(H), 'A4 les fériés du week-end sont dits à part (15 août, 1er novembre)', (H.match(/tomb[\s\S]{0,60}/) || ['(absent)'])[0]);
T(/<details open/.test(H), 'A5 la liste est ouverte quand des fériés portent des heures');
const Hl = bloc(2026, false);
T(/4 f\u00e9ri\u00e9s portent des heures/.test(Hl) && !/planAnneeFeriesChomer|planAnneeFerie\(/.test(Hl), 'A6 sans les droits d’administrateur : le constat, aucun bouton');
// ── B. « Chômer les 4 » : au brouillon, rien d'autre ne bouge ──
F.planAnneeFeriesChomer();
let E = ctx.E(), G = E.brouillon;
T(!!G && [G[3][6], G[4][25], G[6][14], G[10][11]].every(v => !(v > 0)) && E.n === 1 && ctx.RENDUS === 1, 'B1 « Chômer les 4 » : les quatre jours à 0, au brouillon, l’onglet redessiné', JSON.stringify([G && G[3][6], G && G[4][25], G && G[6][14], G && G[10][11], E.n, ctx.RENDUS]));
T(ctx.MODELE[10][11] === 7, 'B2 … le modèle enregistré n’a pas bougé (rien sans « Enregistrer »)');
T(G[10][10] === ctx.G0[10][10] && G[10][12] === ctx.G0[10][12] && G[0][5] === ctx.G0[0][5], 'B3 … les jours voisins gardent leurs heures', JSON.stringify([G[10][10], G[10][12], G[0][5]]));
H = bloc();
T(/Aucun f\u00e9ri\u00e9 n\u2019est travaill\u00e9 au mod\u00e8le\./.test(H) && /<details style/.test(H) && !/<details open/.test(H), 'B4 ensuite : « Aucun férié n’est travaillé au modèle », la liste repliée');
T(/<details open/.test(F._planAnneeFeriesBloc(F._planAnneeLire('mi-temps', 2026, ctx.E().brouillon), 'mi-temps', 2026, true, true)), 'B5 … mais ouverte tant qu’un brouillon est en cours (« Travailler » reste à portée)');
// ── C. « Travailler » : les heures de la saison, ce jour de la semaine ──
const A1 = F._planAnneeLire('mi-temps', 2026, ctx.E().brouillon), S11 = A1.saisons[jour(A1, 10, 11).s];
F.planAnneeFerie(btn(10, 11, 'travailler'));
G = ctx.E().brouillon;
T(G[10][11] === S11.h[2] && S11.h[2] > 0, 'C1 « Travailler » le 11 novembre : les heures de sa saison un mercredi (' + S11.h[2] + ' h)', G[10][11]);
F.planAnneeFerie(btn(10, 11, 'chomer'));
T(!(ctx.E().brouillon[10][11] > 0), 'C2 « Chômer » le remet à 0');
const n0 = ctx.E().n; F.planAnneeFerie(btn(10, 11, 'chomer'));
T(ctx.E().n === n0, 'C3 « Chômer » un férié déjà chômé ne fait rien');
// ── D. La journée de solidarité, un férié pour le domaine ──
etat(); ctx.SOLID = { m: 4, d: 25 };
H = bloc();
T(/3 f\u00e9ri\u00e9s portent des heures\./.test(H) && /Ch\u00f4mer les 3</.test(H) && /lun\.\u00a025\u00a0mai<span[^>]*>Lundi de Pentec\u00f4te<\/span><\/span><span[^>]*>journ\u00e9e de solidarit\u00e9<\/span>/.test(H), 'D1 la journée de solidarité n’est pas à chômer : 3, et la ligne le dit', (H.match(/25\u00a0mai[\s\S]{0,200}/) || ['(absent)'])[0]);
F.planAnneeFeriesChomer();
T(ctx.E().brouillon[4][25] === 7 && !(ctx.E().brouillon[10][11] > 0), 'D2 « Chômer les 3 » la laisse à ses heures');
const n1 = ctx.E().n; F.planAnneeFerie(btn(4, 25, 'chomer'));
T(ctx.E().n === n1 && ctx.E().brouillon[4][25] === 7, 'D3 et un « Chômer » forcé sur elle ne fait rien');
// ── E. La ligne de la semaine ──
etat();
const RA = fonction(PL, '_planRenderAnnee');
T(/\+\(x\.fer\?_planAnneeFerieSem\(x,A,yr,JN\[x\.g\],adm\)/.test(RA), 'E0 la semaine choisie (le rendu de l’onglet) passe ses fériés à _planAnneeFerieSem');
const A2 = F._planAnneeLire('mi-temps', 2026), x11 = jour(A2, 10, 11), x1 = jour(A2, 0, 1);
const L11 = F._planAnneeFerieSem(x11, A2, 2026, 'mercredi', true), L1 = F._planAnneeFerieSem(x1, A2, 2026, 'jeudi', true);
T(/Armistice \u00b7 travaill\u00e9 au mod\u00e8le/.test(L11) && /onclick="planAnneeJour\(this\)">\u2212</.test(L11) && /7\u00a0h<\/b>/.test(L11) && /data-a="chomer"/.test(L11), 'E1 un férié travaillé : « travaillé au modèle », − 7 h +, « Chômer »', L11.slice(0, 260));
T(/Jour de l['\u2019]An \u00b7 ch\u00f4m\u00e9/.test(L1) && /data-a="travailler"/.test(L1), 'E2 un férié chômé : « chômé », « Travailler »', L1.slice(0, 200));
const L11l = F._planAnneeFerieSem(x11, A2, 2026, 'mercredi', false);
T(/travaill\u00e9 au mod\u00e8le/.test(L11l) && !/<button/.test(L11l), 'E3 sans les droits : l’état et les heures, aucun bouton');
ctx.SOLID = { m: 10, d: 11 };
const Ls = F._planAnneeFerieSem(x11, F._planAnneeLire('mi-temps', 2026), 2026, 'mercredi', true);
T(/Armistice \u00b7 journ\u00e9e de solidarit\u00e9/.test(Ls) && !/<button/.test(Ls), 'E4 la journée de solidarité : le dit, aucun bouton');
// ── F. 2027 : la base de l'année est active ──
etat();
const H27 = F._planAnneeFeriesBloc(F._planAnneeLire('mi-temps', 2027), 'mi-temps', 2027, true);
T(/compte quand m\u00eame pour ses heures pr\u00e9vues \(la base de l\u2019ann\u00e9e\)/.test(H27) && !/D\u00e8s 2027/.test(H27), 'F1 en 2027 : « compte quand même pour ses heures prévues »', (H27.match(/mvencadre[\s\S]{0,300}/) || ['(absent : ' + H27.slice(0, 120) + ')'])[0]);
// ── G. Un férié sur un jour de repos de la saison : pas de « Travailler » ──
const x15 = jour(A2, 4, 1);   // vendredi 1er mai
const S15 = A2.saisons[x15.s], v15 = S15.h[4];
const L15 = F._planAnneeFerieSem(x15, A2, 2026, 'vendredi', true);
T(v15 > 0 ? /data-a="travailler"/.test(L15) : !/data-a="travailler"/.test(L15), 'G1 « Travailler » n’est offert que si la saison travaille ce jour-là (vendredi : ' + v15 + ' h)');
F.planAnneeFerie(btn(4, 1, 'travailler'));
T(v15 > 0 ? ctx.E().brouillon[4][1] === v15 : !ctx.E().brouillon, 'G2 … et le geste suit la même règle');

console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
