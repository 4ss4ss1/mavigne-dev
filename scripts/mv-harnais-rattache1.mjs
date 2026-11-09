/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — RATTACHE-1 (§554) : LE MODÈLE QU'UN SALARIÉ SUIT ET LA GRILLE DE SON CONTRAT NE SE CONTREDISENT PLUS
   Lancer : node scripts/mv-harnais-rattache1.mjs          (le contrôle)
            node scripts/mv-harnais-rattache1.mjs --contre  (chaque défaut reposé doit rougir)
   Remonté du terrain le 09/11 : un salarié resté sur « standard » depuis son embauche, et l'admin qui réglait en vain le
   modèle à son nom — personne n'y était inscrit. En cherchant comment il s'y attache, deux défauts : la roue crantée du
   Planning (« Assignation planning ») n'écrivait que planning_id, le MIROIR de la grille du contrat en cours (_mvHistMirror) —
   Réglages affichait encore l'ancienne grille, et le premier événement du contrat la recopiait dans planning_id, sans un mot ;
   et supprimer un modèle sur UNE année remettait ses salariés sur « standard » pour TOUTES les années.
   Les VRAIES fonctions, extraites des fichiers : le journal du contrat (utils.js : _mvHist, _mvPeriodes, _mvHistMirror,
   _mvHistGrille), la roue (planning.js : planAssignTpl, _planSupprEffet, _planSupprTxt, planDeleteTemplate), la fiche
   (reglages.js : _emhCommit, _emhNowHtml, _emhForm). Domaine fictif : Arthur, Léo, Marie, Paul, Lucie — aucun nom, aucune date venus d'un client.
   Contre-épreuve : chaque défaut est posé dans une copie du fichier HORS du dépôt et joué dans un processus à part ; il doit rougir.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ICI = fileURLToPath(import.meta.url);
const R = path.resolve(path.dirname(ICI), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f, env) => fs.readFileSync((env && process.env[env]) || path.join(R, f), 'utf8');

// [ce que le défaut casse, le fichier, la variable qui le remplace, l'ancre exacte, ce qui la remplace]
const DEFAUTS = {
  roue:     ['la roue écrit planning_id seul (le contrat garde l’ancienne grille)', 'src/planning.js', 'MV_R1_PL',
             "if(typeof window._mvHistGrille==='function')window._mvHistGrille(mbr,plId);else mbr.planning_id=plId;", 'mbr.planning_id=plId;'],
  annee:    ['supprimer sur une année ignore les autres années (tout le monde repasse sur « standard »)', 'src/planning.js', 'MV_R1_PL',
             'PLANNING_TEMPLATES[k][id])ailleurs.push(k);', 'PLANNING_TEMPLATES[k][id])0;'],
  miroir:   ['la primitive change le journal sans réécrire le miroir', 'src/utils.js', 'MV_R1_UT',
             '  m.hist = window._mvHist({ hist: H });\n  window._mvHistMirror(m);\n  return true;', '  m.hist = window._mvHist({ hist: H });\n  return true;'],
  commit:   ['un événement du contrat recopie la grille d’embauche (fiche décalée avant ce lot)', 'src/reglages.js', 'MV_R1_RG',
             "if(_cur&&m.planning_id&&(_cur.grille||'standard')!==m.planning_id){", 'if(false){'],
  forme:    ['une nouvelle embauche propose la grille d’embauche restée en arrière', 'src/reglages.js', 'MV_R1_RG',
             "grille:m.planning_id||(last&&last.grille)||'standard',", "grille:(last&&last.grille)||'standard',"],
  carte:    ['la carte « Contrat en cours » affiche la grille d’embauche, pas le modèle suivi', 'src/reglages.js', 'MV_R1_RG',
             "_escHtml(m.planning_id||last.grille||'standard')", "_escHtml(last.grille||'standard')"],
};
if (CONTRE) {
  console.log('\n── RATTACHE-1 — contre-épreuve (un processus par défaut)\n'); let tenues = 0, total = 0;
  for (const [cle, [quoi, fic, env, ancre, rempl]] of Object.entries(DEFAUTS)) {
    total++; const src = lire(fic), n = src.split(ancre).length - 1;
    if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — ancre trouvée ' + n + ' fois'); continue; }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-r1-')), fp = path.join(tmp, path.basename(fic));
    fs.writeFileSync(fp, src.replace(ancre, rempl));
    const r = spawnSync(process.execPath, [ICI], { encoding: 'utf8', timeout: 60000, env: Object.assign({}, process.env, { [env]: fp }) });
    fs.rmSync(tmp, { recursive: true, force: true });
    const det = String(r.stdout || '').split('\n').filter(l => l.includes('✗')).slice(0, 1).join('').replace(/\x1b\[[0-9;]*m/g, '').trim();
    if (r.status !== 0) { tenues++; console.log('  \x1b[32m✓\x1b[0m ' + quoi + ' — vu' + (det ? ' (' + det.slice(0, 110) + ')' : '')); }
    else console.log('  \x1b[31m✗\x1b[0m ' + quoi + ' — non vu');
  }
  console.log(`\n  ${tenues} contre-épreuve(s) tenue(s) sur ${total}\n`); process.exit(tenues === total ? 0 : 1);
}

/* ══ EXTRACTION — les fonctions telles qu'elles sont écrites ══ */
const UT = lire('src/utils.js', 'MV_R1_UT'), PL = lire('src/planning.js', 'MV_R1_PL'), RG = lire('src/reglages.js', 'MV_R1_RG');
function corps(src, debut, nom, fichier) {
  const i = src.indexOf(debut);
  if (i < 0) throw new Error('ABSENTE de ' + fichier + ' : ' + nom);
  const j0 = src.indexOf('{', i); let d = 0;
  for (let j = j0; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}' && --d === 0) return src.slice(i, j + 1) + ';';
  }
  throw new Error('accolade non fermée : ' + nom);
}
const fn = (src, nom, f) => corps(src, '\nfunction ' + nom + '(', nom, f).slice(1);
const win = (src, nom, f) => corps(src, 'window.' + nom + ' = function', nom, f);
function blocVar(src, nom, fichier) {
  const m = new RegExp('^var ' + nom + '\\s*=[^;]*;', 'm').exec(src);
  if (!m) throw new Error('VAR ABSENTE de ' + fichier + ' : ' + nom);
  return m[0];
}
const clone = v => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
let verts = 0; const ECHECS = [];
function T(ok, quoi, det) { if (ok) { verts++; console.log('  \x1b[32m✓\x1b[0m ' + quoi); } else { ECHECS.push(quoi); console.log('  \x1b[31m✗\x1b[0m ' + quoi + (det !== undefined ? ' — ' + String(det).slice(0, 220) : '')); } }
function essai(quoi, f, det) { let v = false, d; try { v = f(); } catch (e) { d = 'plantage : ' + (e && e.message); } if (!v && d === undefined && det) { try { d = det(); } catch (e) { d = 'plantage : ' + (e && e.message); } } T(!!v, quoi, d); }

let H;
const W = {};
const ENV = { SAUVES: [], TOASTS: [], SHEET: '' };
try {
  const code = [
    "window.MV_HIST_TYPES = ['embauche', 'renouvellement', 'fin'];",
    win(UT, '_mvHist', 'src/utils.js'), win(UT, '_mvPeriodes', 'src/utils.js'), win(UT, '_mvHistMirror', 'src/utils.js'), win(UT, '_mvHistGrille', 'src/utils.js'),
    'var PLANNING_TEMPLATES = window.PLANNING_TEMPLATES, planYear = 2026, _planCtxYear = null;',
    fn(PL, '_pY', 'src/planning.js'), fn(PL, '_pTplStore', 'src/planning.js'),
    fn(PL, 'planAssignTpl', 'src/planning.js'), fn(PL, '_planSupprEffet', 'src/planning.js'), fn(PL, '_planSupprTxt', 'src/planning.js'), fn(PL, 'planDeleteTemplate', 'src/planning.js'),
    blocVar(RG, '_EMH_LBL', 'src/reglages.js'),
    fn(RG, '_emhFmt', 'src/reglages.js'), fn(RG, '_emhCommit', 'src/reglages.js'), fn(RG, '_emhNowHtml', 'src/reglages.js'), fn(RG, '_emhForm', 'src/reglages.js'),
    'return { planAssignTpl, _planSupprEffet, _planSupprTxt, planDeleteTemplate, _emhCommit, _emhNowHtml, _emhForm,',
    '  annee: function(y){ planYear = y; }, modeles: function(T){ PLANNING_TEMPLATES = T; window.PLANNING_TEMPLATES = T; } };',
  ].join('\n');
  const DEP = {
    window: W,
    showToast: (t) => ENV.TOASTS.push(t),
    _planRenderCadre: () => {},
    _escHtml: (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    _escAttr: (s) => String(s == null ? '' : s).replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    _paieAuj: () => '2026-11-09',
    _mvIcon: () => '',
    _emhSheet: (h) => { ENV.SHEET = h; },
    _emhTyPick: () => {}, _emhGrPick: () => {}, _emhEff: () => {},
  };
  W.PLANNING_TEMPLATES = {};
  W.fbSaveToast = (o, msg) => { ENV.SAUVES.push({ cles: Object.keys(o).sort().join(','), msg }); };
  W.saveData = (k, msg) => { ENV.SAUVES.push({ cles: k, msg }); };
  W._mvAnnualise = () => true; W._mvPaieTauxEffAt = () => null;
  H = new Function(...Object.keys(DEP), code)(...Object.values(DEP));
} catch (e) {
  console.log('  \x1b[31m✗\x1b[0m extraction impossible : ' + e.message);
  process.exit(1);
}
const periodes = m => W._mvPeriodes(m);
const derniere = m => { const P = periodes(m); return P.length ? P[P.length - 1] : null; };
const embauche = (d, grille, extra) => Object.assign({ d, t: 'embauche', type: 'CDI' }, grille ? { grille } : {}, extra || {});
function fiche(nom, planning_id, hist, extra) {
  const m = Object.assign({ nom, planning_id }, extra || {});
  if (hist) { m.hist = W._mvHist({ hist }); W._mvHistMirror(m); m.planning_id = planning_id; }   // un miroir posé à part : la fiche telle que la roue la laissait
  return m;
}
// Un événement du contrat, comme le fait la fiche (_emhOk, puis _emhDel) : par la vraie _emhCommit.
const evenement = (m, e) => H._emhCommit(m, W._mvHist(m).concat([e]), 'test');
const retrait = (m, t, d) => H._emhCommit(m, W._mvHist(m).filter(e => !(e.t === t && e.d === d)), 'test');

console.log('\n── RATTACHE-1 — le modèle suivi et la grille du contrat\n');

// ── A. Le cas vécu : un salarié embauché sur « standard », rattaché au modèle à son nom depuis la roue ──
let J = fiche('Arthur', 'standard', [embauche('2011-03-07', 'standard')], { debut_contrat: '2011-03-07', type_contrat: 'CDI' });
W.MEMBRES = [J]; ENV.SAUVES = [];
const avant = clone({ d: J.debut_contrat, f: J.fin_contrat, t: J.type_contrat, n: J.hist.length });
H.planAssignTpl('Arthur', 'arthur');
essai('A1 la roue : Arthur suit « arthur » (planning_id)', () => J.planning_id === 'arthur', () => J.planning_id);
essai('A2 … et son contrat en cours porte « arthur » (le journal, la source)', () => (derniere(J) || {}).grille === 'arthur', () => JSON.stringify(J.hist));
essai('A3 rien d’autre ne bouge : dates, type, nombre d’événements', () => JSON.stringify(avant) === JSON.stringify({ d: J.debut_contrat, f: J.fin_contrat, t: J.type_contrat, n: J.hist.length }), () => JSON.stringify(J));
essai('A4 une seule sauvegarde, des membres', () => ENV.SAUVES.length === 1 && ENV.SAUVES[0].cles === 'membres', () => JSON.stringify(ENV.SAUVES));
evenement(J, { d: '2026-11-20', t: 'fin' });
essai('A5 un événement du contrat ensuite ne le remet plus sur « standard »', () => J.planning_id === 'arthur', () => J.planning_id);

// ── B. Une fiche jamais migrée (pas de journal) : on n'en crée pas ──
let L = { nom: 'Léo', planning_id: 'standard', debut_contrat: '2025-03-01', fin_contrat: '2026-12-31', type_contrat: 'CDD' };
W.MEMBRES = [L]; H.planAssignTpl('Léo', 'saisonnier');
essai('B1 sans journal : planning_id change, aucun journal n’est créé', () => L.planning_id === 'saisonnier' && L.hist === undefined, () => JSON.stringify(L));
essai('B2 … et le contrat dérivé porte « saisonnier »', () => (derniere(L) || {}).grille === 'saisonnier', () => JSON.stringify(derniere(L)));

// ── C. Deux contrats : seul celui en cours change de grille ──
let M2 = fiche('Marie', 'standard', [embauche('2024-04-01', 'tractoriste', { type: 'CDD', fin: '2024-10-31' }), embauche('2025-03-01', 'standard')]);
W.MEMBRES = [M2]; H.planAssignTpl('Marie', 'mi-temps');
essai('C1 le contrat en cours passe sur « mi-temps »', () => (derniere(M2) || {}).grille === 'mi-temps' && M2.planning_id === 'mi-temps', () => JSON.stringify(periodes(M2)));
essai('C2 le contrat archivé garde sa grille (« tractoriste »)', () => periodes(M2)[0].grille === 'tractoriste' && (M2.contrats || [])[0] && M2.contrats[0].grille === 'tractoriste', () => JSON.stringify(M2.contrats));

// ── D. Le même modèle : rien à réécrire ──
let P = fiche('Paul', 'standard', [embauche('2020-01-06', 'standard')]); const hist0 = P.hist;
const ch = W._mvHistGrille(P, 'standard');
essai('D1 rattacher au modèle déjà suivi : rien ne change (même journal)', () => ch === false && P.hist === hist0, () => ch);

// ── E. Une fiche décalée AVANT ce lot (planning_id écrit seul par l'ancienne roue) ──
let E1 = fiche('Lucie', 'arthur', [embauche('2019-02-01', 'standard', { type: 'CDD', fin: '2026-12-31' })]);
essai('E0 la fiche décalée : planning_id « arthur », contrat « standard »', () => E1.planning_id === 'arthur' && derniere(E1).grille === 'standard');
const carte = H._emhNowHtml(E1, derniere(E1), true, '2026-11-09');
essai('E1 la carte « Contrat en cours » dit le modèle suivi (« arthur »)', () => /Grille horaire<\/span><b[^>]*>arthur</.test(carte), () => (carte.match(/Grille horaire.{0,80}/) || [''])[0]);
W.MEMBRES = [E1]; H._emhForm('Lucie', 'embauche');
essai('E2 une nouvelle embauche propose le modèle suivi (« arthur »)', () => W._EMH && W._EMH.grille === 'arthur', () => JSON.stringify(W._EMH));
evenement(E1, { d: '2026-11-15', t: 'renouvellement', fin: '2027-06-30' });
essai('E3 un renouvellement ne la remet pas sur « standard » (avant : oui, sans un mot)', () => E1.planning_id === 'arthur', () => E1.planning_id);
essai('E4 … et son contrat garde désormais « arthur » (le journal rattrape le miroir)', () => derniere(E1).grille === 'arthur' && derniere(E1).fin === '2027-06-30', () => JSON.stringify(derniere(E1)));

// ── F. Nouvelle embauche puis retrait, sur une fiche décalée ──
let F1 = fiche('Paul', 'arthur', [embauche('2018-05-01', 'standard', { type: 'CDD', fin: '2026-10-31' })]);
evenement(F1, embauche('2026-11-02', 'saisonnier', { type: 'CDD', fin: '2027-03-31' }));
essai('F1 nouvelle embauche : le contrat d’avant garde le modèle suivi (« arthur »), le nouveau apporte le sien', () => periodes(F1)[0].grille === 'arthur' && F1.planning_id === 'saisonnier', () => JSON.stringify(periodes(F1)));
retrait(F1, 'embauche', '2026-11-02');
essai('F2 retirer cette embauche rend le modèle du contrat d’avant (« arthur »)', () => F1.planning_id === 'arthur' && periodes(F1).length === 1, () => F1.planning_id + ' ' + JSON.stringify(periodes(F1)));

// ── G. Supprimer un modèle sur une année ──
H.modeles({ 2026: { arthur: { 10: { 5: 4 } }, standard: {} }, 2027: { arthur: { 10: { 4: 8 } } } }); H.annee(2027);
let G1 = fiche('Arthur', 'arthur', [embauche('2011-03-07', 'arthur')]); W.MEMBRES = [G1]; ENV.SAUVES = [];
const txt27 = H._planSupprTxt('arthur');
essai('G1 la confirmation (2027) : « de 2027 », « Il reste sur 2026 », personne ne change', () => /de 2027/.test(txt27) && /Il reste sur 2026/.test(txt27) && /personne ne change de mod/.test(txt27), () => txt27);
H.planDeleteTemplate('arthur');
essai('G2 supprimé de 2027 seulement : 2026 garde « arthur »', () => !W.PLANNING_TEMPLATES[2027].arthur && !!W.PLANNING_TEMPLATES[2026].arthur, () => JSON.stringify(Object.keys(W.PLANNING_TEMPLATES[2027])));
essai('G3 Arthur suit toujours « arthur », contrat compris (avant : « standard », toutes années)', () => G1.planning_id === 'arthur' && derniere(G1).grille === 'arthur', () => G1.planning_id);
essai('G4 la sauvegarde ne touche pas les membres', () => ENV.SAUVES.length === 1 && ENV.SAUVES[0].cles === 'planning_templates' && /de 2027/.test(ENV.SAUVES[0].msg), () => JSON.stringify(ENV.SAUVES));
H.modeles({ 2026: { arthur: {}, standard: {} } }); H.annee(2026);
let G5 = fiche('Arthur', 'arthur', [embauche('2011-03-07', 'arthur')]); W.MEMBRES = [G5, { nom: 'Léo', planning_id: 'standard' }]; ENV.SAUVES = [];
const txt26 = H._planSupprTxt('arthur');
essai('G5 sa dernière année : la confirmation nomme Arthur et « standard »', () => /aucune autre ann/.test(txt26) && /Arthur passera sur/.test(txt26) && /standard/.test(txt26), () => txt26);
H.planDeleteTemplate('arthur');
essai('G6 … supprimé : Arthur passe sur « standard », contrat compris', () => G5.planning_id === 'standard' && derniere(G5).grille === 'standard', () => G5.planning_id + ' ' + JSON.stringify(derniere(G5)));
essai('G7 … et les membres sont enregistrés avec le modèle', () => ENV.SAUVES.length === 1 && ENV.SAUVES[0].cles === 'membres,planning_templates', () => JSON.stringify(ENV.SAUVES));
H.modeles({ 2026: { vide: {}, gros: {} } }); W.MEMBRES = ['Ana', 'Bea', 'Cle', 'Dan', 'Eve'].map(n => ({ nom: n, planning_id: 'gros' }));
essai('G8 personne ne le suit : « Personne ne le suit. »', () => /Personne ne le suit\./.test(H._planSupprTxt('vide')), () => H._planSupprTxt('vide'));
essai('G9 cinq salariés : trois nommés, « et 2 autres »', () => /Ana, Bea, Cle et 2 autres passeront/.test(H._planSupprTxt('gros')), () => H._planSupprTxt('gros'));
H.modeles({ 2026: { 'a<b': {} } }); W.MEMBRES = [];
essai('G10 le nom du modèle est échappé dans la confirmation', () => /a&lt;b/.test(H._planSupprTxt('a<b')) && !/a<b/.test(H._planSupprTxt('a<b')), () => H._planSupprTxt('a<b'));

console.log('\n  ' + verts + ' vert · ' + ECHECS.length + ' rouge\n');
process.exit(ECHECS.length ? 1 : 0);
