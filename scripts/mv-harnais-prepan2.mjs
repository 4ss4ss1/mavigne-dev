/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — PREPAN-2 (§560) : L'ANNÉE SUIVANTE, AU GESTE — « N'EXISTE PAS ENCORE », « PARTIR DE 2026 », « PRÉPARER 2027 »
   Lancer : node scripts/mv-harnais-prepan2.mjs          (le contrôle)
            node scripts/mv-harnais-prepan2.mjs --contre  (chaque défaut reposé doit rougir)
   Maquette « modèles suivis » v1, point 5 ; le calcul est PREPAN-1 (§559). Les VRAIES fonctions de planning.js (le report, le
   bandeau du mois), planning-annee.js (la lecture de la frise, le brouillon, l'enregistrement) et planning-modeles.js (la carte,
   les deux départs, la feuille « Préparer »), sur un domaine fictif : « arthur » (lundi → mercredi 8 h, fériés compris, une
   fermeture de deux semaines en août, une prise de poste à 7 h 30), « standard », « saisonnier » (personne ne le suit), « equipe »
   (déjà sur 2027). Stubs : le DOM des feuilles, openOv / closeOv, fbSaveToast, planSetYear, la journée de solidarité (aucune).
   Contre-épreuve : chaque défaut est posé dans une copie des sources HORS du dépôt et joué dans un processus à part.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const SOURCES = () => lire('src/planning.js') + '\n' + lire('src/planning-annee.js') + '\n' + lire('src/planning-modeles.js');
const DEFAUTS = {
  carte:    ['la carte « n’existe pas encore » s’affiche sur un modèle enregistré', "if(st[id]||(E&&E.brouillon))return '';", "if(E&&E.brouillon)return '';"],
  horaires: ['« Partir de 2026 » perd les horaires du modèle repris', 'E.brouillon=_planAnneeCopie(rep.g||{});E.meta=_planAnneeMetaCopie(rep.g||{});', 'E.brouillon=_planAnneeCopie(rep.g||{});E.meta=null;'],
  existe:   ['« Préparer » coche d’office un modèle déjà sur 2027', 'if(!M.existe&&M.gens.length)c[M.id]=true;', 'if(M.gens.length)c[M.id]=true;'],
  cible:    ['« Préparer » écrit sur l’année d’avant', 'var TT=window.PLANNING_TEMPLATES;if(!TT[T])TT[T]={};var rempl=0;', 'var TT=window.PLANNING_TEMPLATES;T=T-1;if(!TT[T])TT[T]={};var rempl=0;'],
  chomer:   ['« Préparer » oublie de chômer les fériés', "if(o.chomer){A=_planAnneeLire(M.id,T,G);_planAnneeFeries(A,T).forEach(function(f){if(f.h>0&&!f.sol)_planAnneePose(G,f.m,f.d,0);});}", ''],
  menu:     ['le menu « … » ouvre encore une année vide', "  else if(k==='preparer'){ if(window.planPrepOuvrir)window.planPrepOuvrir(planYear+1); }", "  else if(k==='preparer') planAddYear();"],
};
if (process.argv.includes('--contre')) {
  console.log('\n── PREPAN-2 — contre-épreuve (un processus par défaut)\n');
  const src = SOURCES(); let tenues = 0, total = 0;
  for (const [, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-pp2-')), fp = path.join(tmp, 'sources.js');
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 120000, env: Object.assign({}, process.env, { MV_PP2_SOURCES: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const det = String(r.stdout || '').split('\n').filter(l => l.includes('✗'))[0] || '';
    if (r.status !== 0) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.replace(/\x1b\[[0-9;]*m/g, '').trim().slice(0, 100) + ')' : '')); }
    else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`); process.exit(tenues === total ? 0 : 1);
}
const PL = process.env.MV_PP2_SOURCES ? fs.readFileSync(process.env.MV_PP2_SOURCES, 'utf8') : SOURCES();
// la vraie fonction, pas son emprunt (chaque fichier emprunte aux autres : « return window.X.apply »)
function fonction(src, nom) {
  const re = new RegExp('^function ' + nom + '\\s*\\(', 'gm'); let m;
  while ((m = re.exec(src))) {
    const i = src.indexOf('{', m.index); let d = 0, corps = null;
    for (let j = i; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (d === 0) { corps = src.slice(m.index, j + 1); break; } } }
    if (!corps) throw new Error('accolades : ' + nom);
    if (!new RegExp('^function ' + nom + '\\(\\)\\{ return window\\.' + nom + '\\.apply\\(null, arguments\\); \\}$').test(corps)) return corps;
  }
  throw new Error('ABSENTE : ' + nom);
}
let verts = 0; const ECHECS = [];
function T(ok, quoi, det) { if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + (det !== undefined ? ' — ' + String(det).slice(0, 220) : '')); } }
let F, ctx; const EL = {}; const el = id => EL[id] || (EL[id] = { id, innerHTML: '', textContent: '', disabled: false });
try {
  const i0 = PL.indexOf('var PLAN_DEF = {'), j0 = PL.indexOf('\n};', i0);
  const NOMS = ['_mvEasterMD', '_feriesY', '_planBaseActive', '_planCreditFerie', '_planRecaleMap', '_planRecale', '_planTplDef', '_planTplDefInfo', '_planTplSource', '_planTplReport', '_planGetTpl',
    '_planRecaleEtat', '_planRecaleSourceTxt', '_planRecaleBar',
    '_planAnneeSaison', '_planAnneeLire', '_planAnneeCopie', '_planAnneeMetaCopie', '_planAnneePose', '_planAnneePasVal', '_planAnneeReguliers', '_planAnneeBrouillon', '_planAnneeCleS', '_planAnneeDate', '_planAnneePlage', '_planAnneeHoraireTxt', '_paH', 'planAnneeEnregistrer',
    '_planAnneeFeries', '_planAnneeManque', 'planAnneePartir', '_planPrepModeles', '_planPrepGrille', '_planPrepFeriesN', '_planPrepPeindre', 'planPrepOuvrir', 'planPrepToggle', 'planPrepFermer', 'planPrepOk'];
  ctx = vm.createContext({ ANNEE: 2027, ADM: true, ACTIFS: [], RENDUS: 0, SAUVES: [], OUVERT: [], FERME: [], AN_VUE: [], document: { getElementById: el },
    PLAN_MOIS_FR: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'], _MV_FERIES_CACHE: {} });
  vm.runInContext(PL.slice(i0, j0 + 3) + '\nvar PLAN_DEF_AN=2026, _PLAN_RECALE_CACHE={}, _PLAN_REPORT_CACHE={}, PLANNING_TEMPLATES={}, _paEtat=null, _paPrep=null;\n'
    + 'var window={CONFIG:{},PLANNING_TEMPLATES:PLANNING_TEMPLATES,MEMBRES:[],PLAN_MOIS:["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],PLAN_MOIS_FR:PLAN_MOIS_FR,showToast:function(){},'
    + 'openOv:function(i){OUVERT.push(i);},closeOv:function(e,i){FERME.push(i);},fbSaveToast:function(o,m){SAUVES.push({cles:Object.keys(o).join(","),msg:m});},planSetYear:function(y){AN_VUE.push(y);},'
    + '_planSurAnnee:function(y,f){var s=ANNEE;ANNEE=y;try{return f();}finally{ANNEE=s;}}};\n'
    + 'function _pY(){return ANNEE;}\nfunction isAdmin(){return ADM;}\nfunction _pl2Actifs(){return ACTIFS;}\nfunction _planPlId(m){return m.planning_id||"standard";}\nfunction _planMbrs(){return (window.MEMBRES||[]).filter(function(m){return m.statut!=="Inactif";});}\n'
    + 'function _mvIcon(){return "";}\nfunction _escHtml(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}\nfunction _escAttr(s){return _escHtml(s).replace(/\'/g,"&#39;");}\n'
    + 'function _planLegal(){return {maxJour:10,hebdoLeg:35,modulMax:250,plafAnnuel:1607};}\nfunction _planFmt(h){return String(h)+" h";}\nfunction _planSolidJour(){return null;}\nfunction _planSolid(){return null;}\n'
    + 'function _paE(){return _paEtat;}\nfunction _planRenderAnnee(){RENDUS++;}\nfunction _pTplStore(){var Y=_pY();if(!PLANNING_TEMPLATES[Y])PLANNING_TEMPLATES[Y]={};return PLANNING_TEMPLATES[Y];}\nfunction planSaveTpl(){SAUVES.push({cles:"planning_templates",msg:"tpl"});}\n'
    + NOMS.map(n => fonction(PL, n)).join('\n') + '\nthis.f={' + NOMS.join(',') + '};this.setT=function(v){PLANNING_TEMPLATES=v;window.PLANNING_TEMPLATES=v;};this.W=window;this.setE=function(v){_paEtat=v;};this.E=function(){return _paEtat;};this.P=function(){return _paPrep;};', ctx);
  F = ctx.f;
} catch (e) { console.log('  \x1b[31m✗\x1b[0m extraction impossible : ' + e.message); process.exit(1); }
const RD = Date;
const grille = (yr, f) => { const o = {}; for (let m = 0; m < 12; m++) { o[m] = {}; const nb = new RD(yr, m + 1, 0).getDate(); for (let d = 1; d <= nb; d++) { const v = f(new RD(yr, m, d).getDay(), m, d); if (v > 0) o[m][d] = v; } } return o; };
// « arthur » 2026 : lundi → mercredi 8 h toute l'année, fériés compris, sauf la fermeture du 10 au 23 août ; prise de poste 7 h 30
const ART26 = grille(2026, (g, m, d) => (g >= 1 && g <= 3 && !(m === 7 && d >= 10 && d <= 23) ? 8 : 0)); ART26._timings = { 0: { d: '07:30' } };
const STD26 = grille(2026, g => (g >= 1 && g <= 5 ? 7 : 0));
const SAI26 = grille(2026, (g, m) => (m >= 8 && m <= 9 && g >= 1 && g <= 6 ? 9 : 0));
const EQ26 = grille(2026, g => (g >= 1 && g <= 4 ? 8 : 0)), EQ27 = grille(2027, g => (g === 2 ? 5 : 0));
function domaine() {
  ctx.setT({ 2026: { arthur: ART26, standard: STD26, saisonnier: SAI26, equipe: EQ26 }, 2027: { equipe: EQ27 } });
  ctx.W.MEMBRES = [{ nom: 'Arthur', planning_id: 'arthur', statut: 'Actif' }, { nom: 'Paul', planning_id: 'standard', statut: 'Actif' }, { nom: 'Léo', planning_id: 'equipe', statut: 'Actif' }];
  ctx.ANNEE = 2027; ctx.ADM = true; ctx.RENDUS = 0; ctx.SAUVES = []; ctx.OUVERT = []; ctx.FERME = []; ctx.AN_VUE = []; ctx.setE({ annee: 'arthur' });
  for (const k in EL) delete EL[k];
}
const jour = (G, m, d) => (G[m] || {})[d] || 0;

console.log('\n── PREPAN-2 — l’année suivante, au geste\n');
domaine();
// ── A. La carte « n'existe pas encore » ──
let C = F._planAnneeManque('arthur', 2027, true, {});
const rep = F._planTplReport('arthur', 2027), trous = rep.perdus.length + rep.vides.length;
T(/\u00ab\u00a0arthur\u00a0\u00bb n\u2019existe pas encore en 2027/.test(C) && /votre \u00ab\u00a0arthur\u00a0\u00bb de 2026, replac\u00e9 sur les jours de 2027\u00a0: un lundi reste un lundi\./.test(C), 'A1 « arthur » absent de 2027 : la carte le dit, et d’où part la frise (votre « arthur » de 2026, replacé)', C.replace(/<[^>]+>/g, ' ').slice(0, 220));
T(new RegExp(trous + ' jours? rest(ent|e) \u00e0 poser').test(C) && /4 f\u00e9ri\u00e9s tombent sur des jours travaill\u00e9s, propos\u00e9s ch\u00f4m\u00e9s/.test(C), 'A2 … ce que le report a coûté : ' + trous + ' jours à poser, 4 fériés travaillés (29 mars, 17 mai, 14 juillet, 1er novembre 2027)', (C.match(/rest[\s\S]{0,200}/) || ['(absent)'])[0]);
T(/data-a="report"[^>]*>Partir de 2026</.test(C) && /data-a="vide"[^>]*>Partir d\u2019une ann\u00e9e vide</.test(C) && /rien n\u2019est \u00e9crit avant votre choix/.test(C), 'A3 deux départs : « Partir de 2026 », « Partir d’une année vide » ; rien n’est écrit avant');
T(!/<button/.test(F._planAnneeManque('arthur', 2027, false, {})), 'A4 sans les droits d’administrateur : le constat, aucun bouton');
T(F._planAnneeManque('equipe', 2027, true, {}) === '' && F._planAnneeManque('arthur', 2027, true, { brouillon: {} }) === '', 'A5 rien sur un modèle enregistré pour 2027, ni pendant un brouillon');
const Ci = F._planAnneeManque('inconnu', 2027, true, {});
T(/le mod\u00e8le int\u00e9gr\u00e9 de l\u2019appli \u2014 le domaine n\u2019a \u00ab\u00a0inconnu\u00a0\u00bb sur aucune ann\u00e9e d\u2019avant/.test(Ci) && />Partir du mod\u00e8le int\u00e9gr\u00e9</.test(Ci), 'A6 un modèle que le domaine n’a jamais eu : « le modèle intégré de l’appli », « Partir du modèle intégré »');
// ── B. Les deux départs ──
F.planAnneePartir({ dataset: { a: 'report' } });
let E = ctx.E();
T(JSON.stringify(E.brouillon) === JSON.stringify(F._planAnneeCopie(rep.g)) && E.meta && E.meta._timings && E.meta._timings[0].d === '07:30' && ctx.RENDUS === 1, 'B1 « Partir de 2026 » : le brouillon est le report, ses horaires compris (7 h 30)', JSON.stringify(E.meta));
domaine(); F.planAnneePartir({ dataset: { a: 'vide' } }); E = ctx.E();
T(Object.keys(E.brouillon).length === 12 && Object.values(E.brouillon).every(m => Object.keys(m).length === 0) && E.meta && Object.keys(E.meta).length === 0, 'B2 « Partir d’une année vide » : douze mois sans heures, sans horaires');
// ── C. « Enregistrer » sur une année neuve garde les horaires du modèle repris ──
domaine(); F.planAnneePartir({ dataset: { a: 'report' } }); F.planAnneeEnregistrer();
let W27 = ctx.W.PLANNING_TEMPLATES[2027].arthur;
T(!!W27 && jour(W27, 10, 1) === 8 && W27._timings && W27._timings[0].d === '07:30', 'C1 « Enregistrer » après « Partir de 2026 » : « arthur » 2027 écrit, horaires compris', JSON.stringify(W27 && W27._timings));
domaine(); ctx.E().brouillon = F._planAnneeBrouillon(ctx.E()); ctx.E().meta = null; F.planAnneeEnregistrer();
W27 = ctx.W.PLANNING_TEMPLATES[2027].arthur;
T(!!W27 && W27._timings && W27._timings[0].d === '07:30', 'C2 un brouillon parti sans le geste (réglé directement) garde aussi les horaires du modèle repris', JSON.stringify(W27 && W27._timings));
domaine(); F.planAnneePartir({ dataset: { a: 'vide' } }); F.planAnneeEnregistrer();
W27 = ctx.W.PLANNING_TEMPLATES[2027].arthur;
T(!!W27 && !W27._timings && Object.keys(W27[0] || {}).length === 0, 'C3 une année vide s’enregistre vide, sans horaires');
// ── D. « Préparer 2027 » ──
domaine(); F.planPrepOuvrir(2027);
let P = ctx.P(), B = el('prep-body').innerHTML;
T(ctx.OUVERT[0] === 'ovPlanPrep' && el('prep-titre').textContent === 'Pr\u00e9parer 2027', 'D1 la feuille s’ouvre : « Préparer 2027 »');
T(P.coches.arthur && P.coches.standard && !P.coches.saisonnier && !P.coches.equipe && P.chomer === true && P.rouvrir === true, 'D2 cochés d’office : ceux qui servent (arthur, standard) ; pas « saisonnier » (personne), pas « equipe » (déjà sur 2027) ; les deux options', JSON.stringify(P));
T(/data-id="saisonnier"[\s\S]*?personne ne le suit/.test(B) && /data-id="equipe"[\s\S]*?existe d\u00e9j\u00e0 en 2027\u00a0: coch\u00e9, il est remplac\u00e9/.test(B) && /L\u00e9o/.test(B), 'D3 chacun dit qui le suit, ses jours à poser, et s’il existe déjà en 2027', B.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 260));
T(/Depuis vos mod\u00e8les 2026\. Chaque mod\u00e8le est replac\u00e9 sur les jours de 2027\u00a0; rien n\u2019est \u00e9crit sur 2026\./.test(el('prep-sous').textContent) && /2 mod\u00e8les pr\u00e9par\u00e9s/.test(B) && el('prep-ok').textContent === 'Pr\u00e9parer 2027' && !el('prep-ok').disabled, 'D4 le sous-titre, le bilan (« 2 modèles préparés »), « Préparer 2027 »', el('prep-sous').textContent);
F.planPrepToggle({ getAttribute: k => (k === 'data-id' ? 'equipe' : null) });
B = el('prep-body').innerHTML;
T(/3 mod\u00e8les pr\u00e9par\u00e9s[\s\S]*\u00ab\u00a0equipe\u00a0\u00bb 2027 remplac\u00e9/.test(B), 'D5 cocher « equipe » : le bilan dit qu’il sera remplacé', (B.match(/id="prep-bilan"[\s\S]{0,220}/) || ['(absent)'])[0]);
const EQ27avant = ctx.W.PLANNING_TEMPLATES[2027].equipe;
F.planPrepOk();
const W = ctx.W.PLANNING_TEMPLATES;
T(!!W[2027].arthur && !!W[2027].standard && W[2027].equipe !== EQ27avant && !W[2027].saisonnier, 'D6 « Préparer 2027 » : arthur et standard écrits, equipe remplacé, saisonnier non', JSON.stringify(Object.keys(W[2027])));
T(W[2026].arthur === ART26 && W[2026].standard === STD26, 'D7 rien n’est écrit sur 2026');
T(jour(W[2027].arthur, 10, 1) === 0 && jour(W[2027].arthur, 10, 2) === 8 && jour(W[2027].arthur, 6, 14) === 0, 'D8 les fériés travaillés chômés : 1er novembre et 14 juillet 2027 à 0, le mardi 2 novembre à 8 h', JSON.stringify([jour(W[2027].arthur, 10, 1), jour(W[2027].arthur, 10, 2), jour(W[2027].arthur, 6, 14)]));
const aout = [9, 10, 11, 16, 17, 18].map(d => jour(W[2027].arthur, 7, d));
T(aout.every(v => v === 8), 'D9 la fermeture d’août rouverte comme la saison (base de l’année active en 2027)', JSON.stringify(aout));
T(W[2027].arthur._timings && W[2027].arthur._timings[0].d === '07:30', 'D10 les horaires du modèle repris sont écrits avec lui');
T(ctx.SAUVES.length === 1 && ctx.SAUVES[0].cles === 'planning_templates' && ctx.SAUVES[0].msg === '\u2705 2027 pr\u00e9par\u00e9\u00a0: 3 mod\u00e8les (1 remplac\u00e9)' && ctx.FERME.includes('ovPlanPrep') && ctx.AN_VUE[0] === 2027, 'D11 une sauvegarde, « ✅ 2027 préparé : 3 modèles (1 remplacé) », la feuille fermée, 2027 affiché', JSON.stringify(ctx.SAUVES));
// options décochées
domaine(); F.planPrepOuvrir(2027); F.planPrepToggle({ getAttribute: k => (k === 'data-k' ? 'chomer' : null) }); F.planPrepToggle({ getAttribute: k => (k === 'data-k' ? 'rouvrir' : null) }); F.planPrepOk();
const A2 = ctx.W.PLANNING_TEMPLATES[2027].arthur;
T(jour(A2, 10, 1) === 8 && [9, 10, 11, 16, 17, 18].every(d => !jour(A2, 7, d)), 'D12 les deux options décochées : les fériés gardent leurs heures, la fermeture reste fermée', JSON.stringify([jour(A2, 10, 1), jour(A2, 7, 9)]));
// sans modèle du domaine
ctx.setT({}); ctx.OUVERT = []; F.planPrepOuvrir(2027);
T(/aucun mod\u00e8le enregistr\u00e9 avant 2027/.test(el('prep-body').innerHTML) && el('prep-ok').disabled === true, 'D13 un domaine sans modèle : la feuille le dit, « Préparer » éteint');
domaine(); ctx.ADM = false; F.planPrepOuvrir(2027);
T(ctx.OUVERT.length === 0, 'D14 sans les droits d’administrateur, rien ne s’ouvre');
// ── E. Le menu « … » et le bandeau du mois ──
T(/\['preparer','Pr\\u00e9parer '\+\(planYear\+1\),'depuis vos mod\\u00e8les '\+planYear\]/.test(PL) && /else if\(k==='preparer'\)\{ if\(window\.planPrepOuvrir\)window\.planPrepOuvrir\(planYear\+1\); \}/.test(PL) && !/\['annee','Ann\\u00e9e '/.test(PL), 'E1 le menu « … » : « Préparer 2027 » (l’année d’après la vue) ouvre la feuille ; « Année 2028 — préparer depuis 2026 » est parti');
domaine(); ctx.ANNEE = 2027; ctx.ACTIFS = [{ planning_id: 'arthur' }];
const Bd = F._planRecaleBar();
T(/onclick="planPrepOuvrir\(\+this\.dataset\.y\)"[^>]*>Pr\u00e9parer 2027</.test(Bd) && /data-y="2027"/.test(Bd), 'E2 le bandeau de 2027 : « Préparer 2027 »', Bd.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 160));
ctx.setT({}); ctx.ACTIFS = [{ planning_id: 'saisonnier' }];
T(/Ouvrir le mod\u00e8le/.test(F._planRecaleBar()) && !/planPrepOuvrir/.test(F._planRecaleBar()), 'E3 sans modèle du domaine : le bandeau garde « Ouvrir le modèle »');

console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
