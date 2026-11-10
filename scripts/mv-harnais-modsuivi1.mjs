/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — MODSUIVI-1 (§555) : QUI SUIT CE MODÈLE — L'ONGLET ANNÉE LE DIT, ET INSCRIT SUR PLACE
   Lancer : node scripts/mv-harnais-modsuivi1.mjs          (le contrôle)
            node scripts/mv-harnais-modsuivi1.mjs --contre  (chaque défaut reposé doit rougir)
   Maquette « modèles suivis » v1, point 3 ; décision D1 (09/11) : tous les mois, l'effet écrit avant de confirmer.
   Les VRAIES fonctions, extraites des fichiers : la carte et la feuille (planning-modeles.js depuis MODELES-DEC, §558 ; l'état et
   les mois de la frise dans planning-annee.js), le modèle d'un jour et son repli
   (planning.js : _planPlanned, _planGetTpl et le recalage), le journal du contrat (utils.js : _mvHist, _mvPeriodes,
   _mvHistMirror, _mvHistGrille). Stubs : le DOM de la feuille, openOv / closeOv, fbSaveToast, la fenêtre de contrat
   (_planInContract : toujours sous contrat), l'horloge (posée au 9 novembre 2026, puis au 15 janvier 2027).
   Domaine fictif : Arthur, Léo, Marie, Paul — aucun nom, aucune date venus d'un client.
   Contre-épreuve : chaque défaut est posé dans une copie de planning-modeles.js HORS du dépôt et joué dans un processus à part.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f, env) => fs.readFileSync((env && process.env[env]) || path.join(R, f), 'utf8');
const DEFAUTS = {
  suivi:    ['l’avertissement « Personne ne suit » ne s’affiche plus', "if(!gens.length)return '<div class=\"mvencadre", "if(false)return '<div class=\"mvencadre"],
  ecriture: ['l’inscription écrit planning_id seul (le contrat garde l’ancienne grille)', "if(typeof window._mvHistGrille==='function')window._mvHistGrille(c.m,c.vers);else c.m.planning_id=c.vers;", 'c.m.planning_id=c.vers;'],
  retrait:  ['décocher quelqu’un ne le remet plus sur « standard »', "else if(!on&&cur===I.modele&&I.modele!=='standard')out.push({m:m,de:cur,vers:'standard'});", ''],
  standard: ['sur « standard », on peut décocher quelqu’un sans l’inscrire ailleurs', "fixe=(I.modele==='standard'&&_planPlId(m)==='standard');", 'fixe=false;'],
  mois:     ['l’effet compte toute l’année au lieu des mois finis', 'cy=t.getFullYear(),m1=t.getMonth()-1;', 'cy=t.getFullYear(),m1=11;'],
  fige:     ['les mois figés pour la compta ne sont plus dits', "if(e.figes.length)h+=", "if(false)h+="],
};
if (CONTRE) {
  console.log('\n── MODSUIVI-1 — contre-épreuve (un processus par défaut)\n'); let tenues = 0, total = 0; const src = lire('src/planning-modeles.js');
  for (const [cle, [quoi, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-ms1-')), fp = path.join(tmp, 'planning-modeles.js');
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 60000, env: Object.assign({}, process.env, { MV_MS1_MO: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const det = String(r.stdout || '').split('\n').filter(l => l.includes('✗')).slice(0, 1).join('').replace(/\x1b\[[0-9;]*m/g, '').trim();
    if (r.status !== 0) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.slice(0, 100) + ')' : '')); }
    else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`); process.exit(tenues === total ? 0 : 1);
}

/* ══ EXTRACTION ══ */
const AN = lire('src/planning-annee.js'), MO = lire('src/planning-modeles.js', 'MV_MS1_MO'), PL = lire('src/planning.js'), UT = lire('src/utils.js');
function corps(src, debut, nom, f) {
  const i = src.indexOf(debut); if (i < 0) throw new Error('ABSENTE de ' + f + ' : ' + nom);
  const j0 = src.indexOf('{', i); let d = 0;
  for (let j = j0; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && --d === 0) return src.slice(i, j + 1) + ';'; }
  throw new Error('accolade non fermée : ' + nom);
}
const fn = (src, nom, f) => corps(src, '\nfunction ' + nom + '(', nom, f).slice(1);
const win = (src, nom, f) => corps(src, 'window.' + nom + ' = function', nom, f);
const ligne = (src, debut, f) => { const i = src.indexOf(debut); if (i < 0) throw new Error('ABSENTE de ' + f + ' : ' + debut); return src.slice(i, src.indexOf('\n', i)); };
let verts = 0; const ECHECS = [];
function T(ok, quoi, det) { if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + (det !== undefined ? ' — ' + String(det).slice(0, 240) : '')); } }
function essai(quoi, f, det) { let v = false, d; try { v = f(); } catch (e) { d = 'plantage : ' + (e && e.message); } if (!v && d === undefined && det) { try { d = det(); } catch (e) { d = 'plantage : ' + (e && e.message); } } T(!!v, quoi, d); }

const W = {}, ENV = { OUVERT: [], FERME: [], SAUVES: [], RENDUS: 0, ADM: true, NOW: [2026, 10, 9] };
const EL = {}; const el = id => EL[id] || (EL[id] = { id, innerHTML: '', textContent: '', disabled: false });
const RealDate = Date;
class FakeDate extends RealDate { constructor(...a) { if (a.length) super(...a); else super(ENV.NOW[0], ENV.NOW[1], ENV.NOW[2], 9, 0, 0); } static now() { return new FakeDate().getTime(); } }
let H;
try {
  const code = [
    "window.MV_HIST_TYPES = ['embauche', 'renouvellement', 'fin'];",
    win(UT, '_mvHist', 'src/utils.js'), win(UT, '_mvPeriodes', 'src/utils.js'), win(UT, '_mvHistMirror', 'src/utils.js'), win(UT, '_mvHistGrille', 'src/utils.js'),
    'var PLANNING_TEMPLATES = window.PLANNING_TEMPLATES, planYear = 2026, _planCtxYear = null, _PLAN_RECALE_CACHE = {}, _MV_FERIES_CACHE = {};',
    ligne(PL, 'var PLAN_DEF_AN=', 'src/planning.js'),
    'var PLAN_DEF = { standard: {} };',
    ...['_pY', '_mvEasterMD', '_feriesY', '_planRecaleMap', '_planRecale', '_planTplDef', '_planGetTpl', '_planPlanned', '_planSolid', '_planSolidJour', '_planEstSolid', '_planSolidRatio', '_planCreditFerie', '_planBaseAn', '_planJoursSem'].map(n => fn(PL, n, 'src/planning.js')),
    'var PLAN_SOLID_MODES = { etalee: 1, ferie: 1, jour: 1, offerte: 1 };',
    'function _planPlId(m){ return m.planning_id || "standard"; }',
    'function _planMbrs(){ return (window.MEMBRES || []).filter(function(m){ return m.statut !== "Inactif"; }); }',
    'function _planInContract(){ return true; }',
    ligne(AN, 'var PLAN_MOIS_FR=', 'src/planning-annee.js'), 'window.PLAN_MOIS_FR = PLAN_MOIS_FR;', 'var _paEtat = null;', fn(AN, '_paE', 'src/planning-annee.js'), fn(AN, '_paH', 'src/planning-annee.js'),
    ligne(MO, 'var _paInscr=', 'src/planning-modeles.js'),
    ...['_planAnneeSuivi', '_planAnneeJourTxt', '_planAnneeInscrSub', '_planAnneeInscrEffet', '_planAnneeInscrChangements', '_planAnneeInscrEffetTxt', '_planAnneeInscrPeindre',
      'planAnneeInscrire', 'planAnneeInscrToggle', 'planAnneeInscrFermer', 'planAnneeInscrOk'].map(n => fn(MO, n, 'src/planning-modeles.js')),
    'return { _planAnneeSuivi, _planAnneeJourTxt, _planAnneeInscrSub, _planAnneeInscrEffet, planAnneeInscrire, planAnneeInscrToggle, planAnneeInscrFermer, planAnneeInscrOk,',
    '  etat: function(e){ _paEtat = e; }, inscr: function(){ return _paInscr; }, modeles: function(T){ PLANNING_TEMPLATES = T; window.PLANNING_TEMPLATES = T; } };',
  ].join('\n');
  W.PLANNING_TEMPLATES = {}; W.PLANNING_HSUP = {}; W.MEMBRES = [];
  W.PLAN_MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  W.CONFIG = {};
  W._planSurAnnee = (y, f) => f();
  W.openOv = id => ENV.OUVERT.push(id); W.closeOv = (e, id) => ENV.FERME.push(id);
  W.fbSaveToast = (o, msg) => ENV.SAUVES.push({ cles: Object.keys(o).sort().join(','), msg });
  const DEP = {
    window: W, Date: FakeDate,
    document: { getElementById: el },
    isAdmin: () => ENV.ADM,
    _escHtml: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    _escAttr: s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    _planRenderAnnee: () => { ENV.RENDUS++; },
  };
  H = new Function(...Object.keys(DEP), code)(...Object.values(DEP));
} catch (e) { console.log('  \x1b[31m✗\x1b[0m extraction impossible : ' + e.message); process.exit(1); }

/* ══ LE DOMAINE FICTIF ══ */
const sem = (yr, f) => { const o = {}; for (let m = 0; m < 12; m++) { o[m] = {}; const nb = new RealDate(yr, m + 1, 0).getDate(); for (let d = 1; d <= nb; d++) { const g = new RealDate(yr, m, d).getDay(); const v = f(g); if (v > 0) o[m][d] = v; } } return o; };
const STD = sem(2026, g => (g >= 1 && g <= 5 ? 8 : 0));                                   // lundi → vendredi 8 h
const ART = sem(2026, g => (g >= 1 && g <= 3 ? 8 : (g === 4 ? 4 : 0)));                    // lundi → mercredi 8 h, jeudi 4 h, vendredi repos
const somme = (G, m1) => { let t = 0; for (let m = 0; m <= m1; m++) for (const d in G[m]) t += G[m][d]; return t; };
const embauche = (d, grille, extra) => Object.assign({ d, t: 'embauche', type: 'CDI', grille }, extra || {});
function fiche(nom, planning_id, hist, extra) { const m = Object.assign({ nom, planning_id, statut: 'Actif', couleur: '#3D6B27' }, extra || {}); if (hist) { m.hist = W._mvHist({ hist }); W._mvHistMirror(m); m.planning_id = planning_id; } return m; }
function domaine() {
  H.planAnneeInscrFermer();
  H.modeles({ 2026: { standard: STD, arthur: ART } });
  W.PLANNING_HSUP = {};
  W.MEMBRES = [fiche('Arthur', 'standard', [embauche('2011-03-07', 'standard')]), fiche('Léo', 'standard', null, { debut_contrat: '2024-04-01' }),
    fiche('Marie', 'standard', [embauche('2023-05-02', 'tractoriste', { type: 'CDD', fin: '2023-10-31' }), embauche('2025-03-03', 'standard')]), fiche('Paul', 'arthur', [embauche('2019-09-02', 'arthur')])];
  ENV.OUVERT = []; ENV.FERME = []; ENV.SAUVES = []; ENV.RENDUS = 0; ENV.ADM = true; ENV.NOW = [2026, 10, 9];
  for (const k in EL) delete EL[k];
}
const mb = nom => W.MEMBRES.find(m => m.nom === nom);
const corpsFeuille = () => el('pins-body').innerHTML;
const toggle = nom => H.planAnneeInscrToggle({ disabled: /data-nom="([^"]*)"[^>]*disabled/.test(corpsFeuille()) && corpsFeuille().includes('data-nom="' + nom + '" disabled'), getAttribute: () => nom });
const derniere = m => { const P = W._mvPeriodes(m); return P.length ? P[P.length - 1] : null; };

console.log('\n── MODSUIVI-1 — qui suit ce modèle\n');
domaine();
// ── A. La carte ──
const vide = H._planAnneeSuivi('arthur', [], true), videLect = H._planAnneeSuivi('arthur', [], false);
essai('A1 personne ne suit le modèle : « Personne ne suit « arthur ». » en tête, et « Inscrire… »', () => /Personne ne suit \u00ab\u00a0arthur\u00a0\u00bb\./.test(vide) && /onclick="planAnneeInscrire\(\)">Inscrire\u2026</.test(vide), () => vide.slice(0, 200));
essai('A2 … sans le bouton pour qui n’est pas administrateur', () => /Personne ne suit/.test(videLect) && !/planAnneeInscrire/.test(videLect));
const plein = H._planAnneeSuivi('arthur', [mb('Paul'), { nom: '<b>X</b>', couleur: '#123456' }], true);
essai('A3 suivi : « Suivi par », les salariés, « Modifier »', () => /Suivi par/.test(plein) && /Paul<\/span>/.test(plein) && /onclick="planAnneeInscrire\(\)">Modifier</.test(plein) && !/Personne ne suit/.test(plein), () => plein.slice(0, 220));
essai('A4 un nom est échappé', () => /&lt;b&gt;X&lt;\/b&gt;/.test(plein) && !/<b>X<\/b>/.test(plein));
// ── B. La feuille s'ouvre ──
H.etat({ annee: 'arthur' }); H.planAnneeInscrire();
essai('B1 « Inscrire… » ouvre la feuille (ovPlanInscr), titrée « Inscrire sur « arthur » »', () => ENV.OUVERT[0] === 'ovPlanInscr' && el('pins-titre').textContent === 'Inscrire sur \u00ab\u00a0arthur\u00a0\u00bb', () => JSON.stringify(ENV.OUVERT) + ' ' + el('pins-titre').textContent);
essai('B2 ceux qui le suivent déjà sont cochés (Paul), les autres non', () => /aria-checked="true" data-nom="Paul"/.test(corpsFeuille()) && /aria-checked="false" data-nom="Arthur"/.test(corpsFeuille()));
essai('B3 rien de changé : « Rien à changer », bouton éteint', () => el('pins-ok').textContent === 'Rien \u00e0 changer' && el('pins-ok').disabled === true, () => el('pins-ok').textContent);
essai('B4 chacun dit ce qu’il suit : « suit « standard » depuis son embauche », « suit déjà ce modèle »', () => /suit \u00ab\u00a0standard\u00a0\u00bb depuis son embauche/.test(corpsFeuille()) && /suit d\u00e9j\u00e0 ce mod\u00e8le depuis son embauche/.test(corpsFeuille()), () => corpsFeuille().slice(0, 400));
essai('B5 deux contrats : « depuis le 3 mars 2025 » ; sans journal, rien d’inventé', () => /data-nom="Marie"[\s\S]*?suit \u00ab\u00a0standard\u00a0\u00bb depuis le 3\u00a0mars\u00a02025/.test(corpsFeuille()) && /data-nom="L\u00e9o"[\s\S]*?suit \u00ab\u00a0standard\u00a0\u00bb<\/span>/.test(corpsFeuille()), () => (corpsFeuille().match(/data-nom="Marie"[\s\S]{0,260}/) || [''])[0]);
// ── C. Cocher Arthur : l'effet, écrit avant ──
toggle('Arthur');
const a10 = somme(STD, 9), b10 = somme(ART, 9);
essai('C1 l’effet : « Arthur passe de « standard » à « arthur » sur tous ses mois, les mois passés compris. »', () => /Arthur passe de \u00ab\u00a0standard\u00a0\u00bb \u00e0 \u00ab\u00a0arthur\u00a0\u00bb sur tous ses mois, les mois pass\u00e9s compris\./.test(corpsFeuille()), () => (corpsFeuille().match(/id="pins-effet"[\s\S]{0,300}/) || [''])[0]);
const ttxt = h => { const n = Math.floor(h + 1e-9), mm = Math.round((h - n) * 60); return n.toLocaleString('fr-FR') + '\u00a0h' + (mm ? '\u00a0' + String(mm).padStart(2, '0') : ''); };
essai('C2 les heures prévues de janvier à octobre, comptées sur les deux modèles (' + a10 + ' h → ' + b10 + ' h)', () => corpsFeuille().includes('De janvier \u00e0 octobre, ses heures pr\u00e9vues passent de ' + ttxt(a10) + ' \u00e0 ' + ttxt(b10) + ' (\u2212\u00a0' + ttxt(a10 - b10) + ')'), () => (corpsFeuille().match(/De janvier[^<]{0,160}/) || ['(absent)'])[0]);
essai('C3 … « La grille horaire de son contrat devient « arthur ». » ; le bouton dit « Inscrire Arthur »', () => /La grille horaire de son contrat devient \u00ab\u00a0arthur\u00a0\u00bb\./.test(corpsFeuille()) && el('pins-ok').textContent === 'Inscrire Arthur' && !el('pins-ok').disabled, () => el('pins-ok').textContent);
// ── D. Un mois figé pour la compta ──
W.PLANNING_HSUP = { Arthur: { '2026-10': { fige: { le: '2026-11-03' } } } }; toggle('Arthur'); toggle('Arthur');
essai('D1 un mois figé est dit : « Son mois figé pour la compta (octobre) garde ce qui est parti. »', () => /Son mois fig\u00e9 pour la compta \(octobre\) garde ce qui est parti\./.test(corpsFeuille()), () => (corpsFeuille().match(/fig[^<]{0,120}/) || ['(absent)'])[0]);
// ── E. Inscrire : la primitive, la sauvegarde, la fermeture ──
H.planAnneeInscrOk();
essai('E1 Arthur suit « arthur » : planning_id ET la grille de son contrat (_mvHistGrille)', () => mb('Arthur').planning_id === 'arthur' && derniere(mb('Arthur')).grille === 'arthur', () => mb('Arthur').planning_id + ' ' + JSON.stringify(mb('Arthur').hist));
essai('E2 une sauvegarde des membres, « ✅ Arthur suit « arthur » »', () => ENV.SAUVES.length === 1 && ENV.SAUVES[0].cles === 'membres' && ENV.SAUVES[0].msg === '\u2705 Arthur suit \u00ab\u00a0arthur\u00a0\u00bb', () => JSON.stringify(ENV.SAUVES));
essai('E3 la feuille se ferme et l’onglet se redessine', () => ENV.FERME.includes('ovPlanInscr') && ENV.RENDUS === 1 && H.inscr() === null);
// ── F. Décocher quelqu'un : il repasse sur « standard » ──
domaine(); H.etat({ annee: 'arthur' }); H.planAnneeInscrire(); toggle('Paul');
essai('F1 décocher Paul : « Paul repasse sur « standard » », bouton « Enregistrer »', () => /Paul repasse sur \u00ab\u00a0standard\u00a0\u00bb sur tous ses mois/.test(corpsFeuille()) && el('pins-ok').textContent === 'Enregistrer', () => el('pins-ok').textContent);
H.planAnneeInscrOk();
essai('F2 … enregistré : Paul sur « standard », contrat compris', () => mb('Paul').planning_id === 'standard' && derniere(mb('Paul')).grille === 'standard' && /Paul repasse sur/.test(ENV.SAUVES[0].msg), () => mb('Paul').planning_id + ' ' + JSON.stringify(ENV.SAUVES));
// ── G. Sur « standard » : on n'en sort qu'en s'inscrivant ailleurs ──
domaine(); H.etat({ annee: 'standard' }); H.planAnneeInscrire();
essai('G1 les salariés de « standard » y sont cochés, la case éteinte, la raison dite', () => /aria-checked="true" data-nom="Arthur" disabled/.test(corpsFeuille()) && /pour l\u2019en sortir, inscrivez-le sur un autre mod\u00e8le/.test(corpsFeuille()), () => (corpsFeuille().match(/data-nom="Arthur"[^>]*/) || [''])[0]);
toggle('Arthur');
essai('G2 … et les toucher ne change rien', () => mb('Arthur').planning_id === 'standard' && el('pins-ok').disabled === true && H.inscr().coches.Arthur === true);
toggle('Paul');
essai('G3 Paul (sur « arthur ») se coche : « Paul passe de « arthur » à « standard » »', () => /Paul passe de \u00ab\u00a0arthur\u00a0\u00bb \u00e0 \u00ab\u00a0standard\u00a0\u00bb/.test(corpsFeuille()), () => (corpsFeuille().match(/id="pins-effet"[\s\S]{0,200}/) || ['(absent)'])[0]);
// ── H. Plusieurs à la fois ──
domaine(); H.etat({ annee: 'arthur' }); H.planAnneeInscrire(); toggle('Léo'); toggle('Marie');
essai('H1 deux cochés : « Inscrire 2 personnes »', () => el('pins-ok').textContent === 'Inscrire 2 personnes', () => el('pins-ok').textContent);
H.planAnneeInscrOk();
essai('H2 … « ✅ 2 salariés suivent « arthur » », les deux écrits', () => ENV.SAUVES[0].msg === '\u2705 2 salari\u00e9s suivent \u00ab\u00a0arthur\u00a0\u00bb' && mb('Léo').planning_id === 'arthur' && mb('Marie').planning_id === 'arthur' && !mb('Léo').hist, () => JSON.stringify(ENV.SAUVES));
// ── I. En janvier : aucun mois fini ──
domaine(); ENV.NOW = [2027, 0, 15]; H.modeles({ 2026: { standard: STD, arthur: ART }, 2027: { arthur: ART } }); H.etat({ annee: 'arthur' }); H.planAnneeInscrire(); toggle('Arthur');
essai('I1 en janvier : « Aucun mois de l’année n’est encore fini »', () => /Aucun mois de l\u2019ann\u00e9e n\u2019est encore fini/.test(corpsFeuille()), () => (corpsFeuille().match(/id="pins-effet"[\s\S]{0,260}/) || ['(absent)'])[0]);
// ── J. Pas administrateur : rien ne s'ouvre ──
domaine(); ENV.ADM = false; H.etat({ annee: 'arthur' }); H.planAnneeInscrire();
essai('J1 sans les droits d’administrateur, « Inscrire… » n’ouvre rien', () => ENV.OUVERT.length === 0 && H.inscr() === null);
// ── K. Les dates dites en français ──
essai('K1 « 7 mars 2011 », « 1er mai 2026 »', () => H._planAnneeJourTxt('2011-03-07') === '7\u00a0mars\u00a02011' && H._planAnneeJourTxt('2026-05-01') === '1er\u00a0mai\u00a02026', () => H._planAnneeJourTxt('2011-03-07') + ' | ' + H._planAnneeJourTxt('2026-05-01'));

console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
