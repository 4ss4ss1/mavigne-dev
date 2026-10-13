// HARNAIS — RETRAIT-1 (§324) : une tâche ordinaire se désactive sur des parcelles POUR LA PÉRIODE.
//   node scripts/mv-harnais-retrait1.mjs           → doit être vert
//   node scripts/mv-harnais-retrait1.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions extraites (commentaires retirés) : la règle (utils.js, blocs SEL-1 et RETRAIT-1), la feuille,
// la croix et les lecteurs (app.js), les renommages (reglages.js), surfFn (planning.js), la clé de L'année (pilotage.js).
// Nico (13/10) : « en hiver, certaines vignes à réparer ; au printemps, d'autres » — par période, en sélection multiple.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC = { ut: lire('src/utils.js'), app: lire('src/app.js'), reg: lire('src/reglages.js'), pla: lire('src/planning.js'), pil: lire('src/pilotage.js') };
const HTML = lire('index.html'), G04 = lire('guide/04-vigne.html');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function bloc(src, a, b, nom) {
  const i = src.indexOf(a), j = src.indexOf(b, i);
  if (i < 0 || j < 0) throw new Error('bloc introuvable : ' + nom);
  return src.slice(i, j + b.length);
}
function fn(src, sig) {
  const i = src.indexOf(sig); if (i < 0) throw new Error('fonction introuvable : ' + sig);
  const j = src.indexOf('\n}\n', i); return src.slice(i, j + 3);
}
function extraire(S) {
  const UT = [
    S.ut.match(/var MV_EX_MOIS_LBL = .*;/)[0], 'var MV_CAMP_MOIS_DEF = 7;',
    fn(S.ut, 'function _mvCampagneMois(){'), fn(S.ut, 'function _mvCampagneDe(iso){'),
    fn(S.ut, 'function _mvCampagneBornes(c){'), fn(S.ut, 'function _saisonObj(nom){'),
    'function _mvAujIso(){ return window.__AUJ; }',
    bloc(S.ut, 'var MV_TACHES_SEL', 'window._mvSelResume       = _mvSelResume;', 'SEL-1'),
    bloc(S.ut, '// ★★ RETRAIT-1 (§324) — UNE TÂCHE ORDINAIRE', 'window._mvPerResume       = _mvPerResume;', 'RETRAIT-1'),
  ].join('\n');
  const APP = bloc(S.app, '// ══════ SEL-1', 'function saveSelParc(){', 'feuille')
    + fn(S.app, 'function saveSelParc(){').slice('function saveSelParc(){'.length)
    + fn(S.app, 'function toggleExcluTache(nomParcelle,nomTache){') + fn(S.app, 'function _mvExclu(p,nom,exclues){') + fn(S.app, 'function _parcConcern(nomTache){');
  const ri = S.reg.indexOf('function _renRang(v){'), rj = S.reg.indexOf('function _renameTache(oldN,newN){');
  if (ri < 0 || rj < 0) throw new Error('renommage introuvable');
  const REG = fn(S.reg, 'function _renamePeriode(oldN,newN){') + S.reg.slice(ri, rj) + fn(S.reg, 'function _renameTache(oldN,newN){');
  const sf = S.pla.match(/ {2}function surfFn\(nm\)\{[^\n]*\n/); if (!sf) throw new Error('surfFn introuvable');
  const pi = S.pil.indexOf('  function _annSigP(p){'); if (pi < 0) throw new Error('_annSigP introuvable');
  const PIL = S.pil.slice(pi, S.pil.indexOf('\n  }\n', pi) + 4);
  return { UT: sansCom(UT), APP: sansCom(APP), REG: sansCom(REG), SURF: sf[0], PIL };
}
function monde(X, { admin = true, visu = 'Printemps 2027' } = {}) {
  const toasts = [], log = [], els = {};
  const el = id => (els[id] ||= { id, value: '', textContent: '', innerHTML: '' });
  const ctx = {
    console, Date, Math, String, Number, Array, Object, JSON, parseInt, parseFloat, isNaN,
    __AUJ: '2027-03-20', CONFIG: {}, JOURNAL: [], TRAVAUX: {}, SESSIONS: [], HISTORIQUE: [],
    SAISONS: [
      { nom: 'Hiver 2026', debut: '2026-11-01', fin: '2027-02-28' },
      { nom: 'Printemps 2027', debut: '2027-03-01', fin: '2027-06-30', active: true },
      { nom: 'Été 2027', debut: '2027-07-01', fin: '2027-08-31' }],
    PARCELLES: [
      { nom: 'A', surface: 1, statut: 'Active', taches: {} },
      { nom: 'B', surface: 0.5, statut: 'Active', taches: {}, tachesExclues: ['Reparation'] },
      { nom: 'C', surface: 0.25, statut: 'Arrachee', taches: {} },
      { nom: 'D', surface: 2, statut: 'Active', taches: { Reparation: 'En cours' } },
      { nom: 'E', surface: 0.75, statut: 'Active', taches: {}, horsPer: { 'Printemps 2027': ['Reparation'] } }],
    TACHES: [{ nom: 'Reparation' }, { nom: 'Embouts', custom: true }],
    TACHES_CATALOGUE: [{ nom: 'Reparation', label: 'Réparation' }, { nom: 'Effeuillage', label: 'Effeuillage' }],
    isAdmin: () => admin, getSaisonActive: () => ({ nom: 'Printemps 2027' }), _visuSaison: () => visu,
    getTacheStatut: (p, t) => (p.taches && typeof p.taches[t] === 'string') ? p.taches[t] : 'Non démarré',
    _escHtml: s => String(s), _escAttr: s => String(s),
    document: { getElementById: id => (id.startsWith('selp-') ? el(id) : null) },
    openOv: id => log.push('open:' + id), closeOv: (e, id) => log.push('close:' + id),
    showToast: m => toasts.push(m), saveData: k => log.push('save:' + k), recalcTravaux: n => log.push('recalc:' + n),
    renderParcelles: () => 0, computePStats: () => 0, openDP: n => log.push('dp:' + n),
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(X.UT + '\nwindow._mvCampagneBornes=_mvCampagneBornes;\n' + X.APP + '\n' + X.REG
    + '\nthis.__f={openSelParc,openPerParc,_mvSelPick,_mvSelTous,saveSelParc,toggleExcluTache,_mvExclu,_parcConcern,_renamePeriode,_renameTache,'
    + 'surf:function(s){' + X.SURF + ' return surfFn;},annSig:(function(){' + X.PIL + '\n return _annSigP;})()};', ctx);
  return { ctx, f: ctx.__f, toasts, log, el };
}
function suite(X) {
  const out = [];
  const T = (n, f) => { let c; try { c = !!f(); } catch (e) { c = false; n += ' [exception : ' + e.message + ']'; } out.push([n, c]); };
  const P = (w, n) => w.ctx.PARCELLES.find(x => x.nom === n);
  let w = monde(X); const c = w.ctx;
  T('A1 tâche ordinaire : A concernée, B (retrait d’avant) non, E désactivée pour le printemps', () => c._mvTacheConcerne(P(w, 'A'), 'Reparation') && !c._mvTacheConcerne(P(w, 'B'), 'Reparation') && !c._mvTacheConcerne(P(w, 'E'), 'Reparation'));
  T('A2 E reste concernée l’hiver et l’été ; B nulle part (période passée en argument)', () => c._mvConcernePer(P(w, 'E'), 'Reparation', 'Hiver 2026') && c._mvConcernePer(P(w, 'E'), 'Reparation', 'Été 2027') && !c._mvConcernePer(P(w, 'B'), 'Reparation', 'Hiver 2026'));
  T('A3 la même règle sur la période consultée : _mvConcernePer = _mvTacheConcerne', () => ['A', 'B', 'D', 'E'].every(n => ['Reparation', 'Embouts', 'Effeuillage'].every(t => c._mvConcernePer(P(w, n), t, 'Printemps 2027') === c._mvTacheConcerne(P(w, n), t))));
  T('A4 une autre tâche de la même parcelle n’est pas touchée', () => c._mvTacheConcerne(P(w, 'E'), 'Embouts'));
  T('A5 tâche à la sélection : p.horsPer ignoré, _mvHorsPose la refuse', () => { const p = P(w, 'A'); p.horsPer = { 'Printemps 2027': ['Effeuillage'] }; c._mvSelPose(p, 'Effeuillage', true); const r = c._mvTacheConcerne(p, 'Effeuillage'); delete p.horsPer; return r && c._mvHorsPose(p, 'Effeuillage', true) === false; });
  T('A6 _mvHorsPose : un objet neuf à chaque écriture, plus rien → horsPer retiré', () => {
    const p = P(w, 'A'); c._mvHorsPose(p, 'Reparation', true); const o1 = p.horsPer; c._mvHorsPose(p, 'Embouts', true);
    const neuf = p.horsPer !== o1 && o1['Printemps 2027'].length === 1 && p.horsPer['Printemps 2027'].length === 2;
    c._mvHorsPose(p, 'Reparation', false); c._mvHorsPose(p, 'Embouts', false); return neuf && !('horsPer' in p); });
  T('A7 remettre B (retrait d’avant) : concernée au printemps, gardée hors l’hiver et l’été, l’ancien retrait disparaît', () => {
    const p = P(w, 'B'); c._mvPerRemet(p, 'Reparation');
    return c._mvTacheConcerne(p, 'Reparation') && !c._mvConcernePer(p, 'Reparation', 'Hiver 2026') && !c._mvConcernePer(p, 'Reparation', 'Été 2027') && p.tachesExclues.indexOf('Reparation') < 0 && !p.horsPer['Printemps 2027']; });
  T('A8 une période créée après coup : B concernée (la règle neuve)', () => c._mvConcernePer(P(w, 'B'), 'Reparation', 'Hiver 2027'));
  w = monde(X);
  T('A9 résumé : 2 parcelles sur 4 (l’arrachée hors compte), 3 ha, période consultée', () => { const r = w.ctx._mvPerResume('Reparation'); return r.n === 2 && r.N === 4 && r.ha === 3 && r.per === 'Printemps 2027'; });
  T('B1 _mvExclu et _parcConcern : E hors au printemps', () => w.f._mvExclu(P(w, 'E'), 'Reparation') && w.f._parcConcern('Reparation').map(p => p.nom).join() === 'A,D');
  const wh = monde(X, { visu: 'Hiver 2026' });
  T('B2 l’hiver consulté : E revient', () => !wh.f._mvExclu(P(wh, 'E'), 'Reparation') && wh.f._parcConcern('Reparation').map(p => p.nom).join() === 'A,D,E');
  T('B3 surfFn (L’année) lit SA période : hiver 3,75 ha, printemps 3 ha', () => Math.abs(w.f.surf({ nom: 'Hiver 2026' })('Reparation') - 3.75) < 1e-9 && Math.abs(w.f.surf({ nom: 'Printemps 2027' })('Reparation') - 3) < 1e-9);
  T('B4 la clé de L’année suit une désactivation par période, et l’échange de deux retraits', () => {
    const s0 = w.f.annSig(P(w, 'A')); w.ctx._mvHorsPose(P(w, 'A'), 'Reparation', true); const s1 = w.f.annSig(P(w, 'A')); w.ctx._mvHorsPose(P(w, 'A'), 'Reparation', false);
    return s0 !== s1 && w.f.annSig({ statut: 'Active', surface: 1, tachesExclues: ['Taille'] }) !== w.f.annSig({ statut: 'Active', surface: 1, tachesExclues: ['Pliage'] }) && w.f.annSig(null) === ''; });
  w = monde(X);
  T('C1 la croix sur A : désactivée pour le printemps seulement, rien pour toujours', () => { w.f.toggleExcluTache('A', 'Reparation'); const p = P(w, 'A'); return !w.ctx._mvTacheConcerne(p, 'Reparation') && w.ctx._mvConcernePer(p, 'Reparation', 'Hiver 2026') && !(p.tachesExclues || []).length && w.log.includes('save:parcelles'); });
  T('C2 « Réactiver » sur A : remise, plus de horsPer', () => { w.f.toggleExcluTache('A', 'Reparation'); return w.ctx._mvTacheConcerne(P(w, 'A'), 'Reparation') && !('horsPer' in P(w, 'A')); });
  T('C3 « Réactiver » sur B (retrait d’avant) : remise au printemps, l’hiver garde son retrait', () => { w.f.toggleExcluTache('B', 'Reparation'); const p = P(w, 'B'); return w.ctx._mvTacheConcerne(p, 'Reparation') && !w.ctx._mvConcernePer(p, 'Reparation', 'Hiver 2026'); });
  w = monde(X);
  w.f.openPerParc('Reparation');
  let rows = w.el('selp-rows').innerHTML;
  T('D1 ouverte sur la période consultée, l’arrachée absente', () => w.log.includes('open:ovSelParc') && w.el('selp-sub').textContent.includes('Printemps 2027') && !rows.includes('data-selp-n="C"') && rows.includes('data-selp-n="A"'));
  T('D2 tout coché d’office sauf les désactivées : A et D cochées, B et E non', () => /pchk sel vert" data-selp-n="A"/.test(rows) && /pchk sel vert" data-selp-n="D"/.test(rows) && /class="pchk" data-selp-n="B"/.test(rows) && /class="pchk" data-selp-n="E"/.test(rows));
  T('D3 D dit « commencée », B « toutes les périodes », l’en-tête parle de la période', () => /data-selp-n="D"[^>]*title="Commenc/.test(rows) && /data-selp-n="B"[^<]*<span[^>]*>[^<]*toutes les périodes/.test(rows) && /période/.test(w.el('selp-intro').textContent));
  T('D4 total : 2 parcelles sur 4', () => /^2 parcelles sur 4/.test(w.el('selp-tot').textContent));
  w.f._mvSelTous(false); rows = w.el('selp-rows').innerHTML;
  T('D5 « Tout décocher » : A décochée, D (commencée) reste cochée', () => /class="pchk" data-selp-n="A"/.test(rows) && /pchk sel vert" data-selp-n="D"/.test(rows));
  w.f._mvSelPick({ getAttribute: () => 'D' });
  T('D6 D ne se décoche pas (« Commencée cette période »)', () => w.toasts.some(m => /Commencée cette période/.test(m)));
  w.f._mvSelPick({ getAttribute: () => 'B' });
  w.f.saveSelParc();
  T('D7 enregistrer : A désactivée au printemps, B remise (gardée hors l’hiver), D et E intactes, sauvé et recalculé', () => {
    const k = w.ctx, A = P(w, 'A'), B = P(w, 'B'), D = P(w, 'D'), E = P(w, 'E');
    return !k._mvTacheConcerne(A, 'Reparation') && k._mvConcernePer(A, 'Reparation', 'Hiver 2026') && k._mvTacheConcerne(B, 'Reparation') && !k._mvConcernePer(B, 'Reparation', 'Hiver 2026')
      && k._mvTacheConcerne(D, 'Reparation') && !('horsPer' in D) && !k._mvTacheConcerne(E, 'Reparation')
      && w.log.includes('save:parcelles') && w.log.includes('recalc:Reparation') && w.toasts.some(m => /2 parcelles · Printemps 2027/.test(m)); });
  w.f.openSelParc('Effeuillage');
  T('D8 la feuille de l’effeuillage reprend son texte de campagne', () => /campagne/.test(w.el('selp-intro').textContent) && w.el('selp-sub').textContent.includes('campagne'));
  const w2 = monde(X, { admin: false }); w2.f.openPerParc('Reparation');
  T('D9 non-admin : rien ne s’ouvre', () => !w2.log.includes('open:ovSelParc'));
  const w3 = monde(X); w3.f.openPerParc('Reparation'); w3.f._mvSelPick({ getAttribute: () => 'A' }); w3.ctx.isAdmin = () => false; w3.f.saveSelParc();
  T('D10 non-admin : la garde est dans l’écriture', () => !w3.log.includes('save:parcelles') && w3.ctx._mvTacheConcerne(P(w3, 'A'), 'Reparation'));
  const w4 = monde(X); w4.f.openPerParc('Effeuillage');
  T('D11 une tâche à la sélection garde sa feuille de campagne', () => !w4.log.includes('open:ovSelParc'));
  w = monde(X); P(w, 'E').horsPer['Printemps 2027'].push('Embouts');
  w.f._renamePeriode('Printemps 2027', 'Printemps 27');
  T('E1 renommer la période emmène ses désactivations', () => { const h = P(w, 'E').horsPer; return h && !h['Printemps 2027'] && h['Printemps 27'].indexOf('Reparation') >= 0; });
  w.f._renameTache('Embouts', 'Embout');
  T('E2 renommer une tâche la renomme dans les désactivations', () => P(w, 'E').horsPer['Printemps 27'].indexOf('Embout') >= 0 && P(w, 'E').horsPer['Printemps 27'].indexOf('Embouts') < 0);
  T('F1 index.html : l’en-tête nommé, « Tout cocher » et « Tout décocher »', () => HTML.includes('id="selp-intro"') && HTML.includes('onclick="_mvSelTous(true)"') && HTML.includes('onclick="_mvSelTous(false)"'));
  T('F2 app.js expose openPerParc et _mvSelTous', () => ['openPerParc', '_mvSelTous'].every(n => SRC.app.includes('window.' + n + ' = ' + n)));
  T('F3 la roue crantée ouvre la feuille d’une tâche ordinaire', () => SRC.reg.includes('window.openPerParc(') && SRC.reg.includes('window._mvPerResume('));
  T('F4 l’aide, le guide et la nouveauté le disent', () => SRC.ut.includes('Une tâche qui ne se fait pas partout') && G04.includes('Une tâche ne se fait pas sur toutes les parcelles') && /v: '8\.92'[\s\S]{0,400}plusieurs parcelles/.test(SRC.ut));
  return out;
}
let ok = 0, ko = 0;
let base; try { base = suite(extraire(SRC)); } catch (e) { base = [['extraction : ' + e.message, false]]; }
base.forEach(([n, c]) => { if (c) ok++; else ko++; console.log((c ? '  \u2713 ' : '  \u2717 ') + n); });
console.log(`\nRETRAIT-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) { console.log('base rouge : contre-épreuve sans objet'); process.exit(1); }
const DEFAUTS = [
  ['la règle ignore la période (le défaut demandé)', 'ut', ' && !(p.horsPer && _mvHorsPer(p, nom));', ';'],
  ['_mvConcernePer lit la période consultée', 'ut', 'return (p.tachesExclues || []).indexOf(nom) < 0 && !_mvHorsPer(p, nom, per);', 'return (p.tachesExclues || []).indexOf(nom) < 0 && !_mvHorsPer(p, nom);'],
  ['réactiver efface l’historique (retrait d’avant supprimé sans conversion)', 'ut', '    (window.SAISONS || []).forEach(function(s){ if(s && s.nom && String(s.nom) !== k) _mvHorsPose(p, nom, true, s.nom); });\n', ''],
  ['_mvHorsPose modifie l’objet en place', 'ut', 'Object.assign({}, p.horsPer)', 'p.horsPer'],
  ['la croix écrit un retrait pour toujours', 'app', "  } else if(typeof window._mvHorsPose==='function'&&typeof window._mvPerRemet==='function'){", '  } else if(false){'],
  ['une parcelle commencée se décoche', 'app', "if(conc&&(st==='Valid\\u00e9'||st==='En cours')) _SELP.trav[p.nom]=true;", ''],
  ['enregistrer passe par la sélection de campagne', 'app', "  if(_SELP.mode==='per') return _mvPerSave();", ''],
  ['_mvExclu ignore la période', 'app', "  if(typeof window._mvHorsPer==='function' && window._mvHorsPer(p,nom)) return true;", ''],
  ['_parcConcern ignore la période', 'app', " && !(typeof window._mvHorsPer==='function' && window._mvHorsPer(p,nomTache))", ''],
  ['la feuille de campagne garde le texte de la période', 'app', 'if(_it) _it.textContent=_SELP_INTRO.sel;', ''],
  ['renommer la période oublie ses désactivations', 'reg', '_hp[newN]=_hp[oldN]; delete _hp[oldN]; p.horsPer=_hp;', ''],
  ['renommer la tâche oublie les désactivations', 'reg', 'Object.keys(p.horsPer).forEach(function(k){ rl(p.horsPer[k]); });', ''],
  ['surfFn lit la période consultée', 'pla', 'window._mvConcernePer(p,nm,s.nom)', 'window._mvConcernePer(p,nm)'],
  ["la clé de L'année ignore les désactivations par période", 'pil', "+':'+JSON.stringify(p.horsPer||'')", ''],
];
let rougies = 0;
DEFAUTS.forEach(([nom, k, a, b]) => {
  const n = SRC[k].split(a).length - 1;
  if (n !== 1) { console.log('  \u26a0 défaut non injecté (' + n + ' occurrence(s)) : ' + nom); return; }
  const S2 = Object.assign({}, SRC, { [k]: SRC[k].replace(a, b) });
  let r2; try { r2 = suite(extraire(S2)); } catch (e) { r2 = [['exception ' + e.message, false]]; }
  const rouge = r2.some(([, x]) => !x);
  if (rouge) rougies++;
  console.log((rouge ? '  \u2713 rougit : ' : '  \u2717 RESTE VERT : ') + nom);
});
console.log(`\ncontre-épreuves : ${rougies}/${DEFAUTS.length} rougissent`);
process.exit(rougies === DEFAUTS.length ? 0 : 1);
