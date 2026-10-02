// HARNAIS — SEL-1 : les tâches « à la sélection » (Arrachage, Désherbage manuel, Effeuillage).
//   node scripts/mv-harnais-selection.mjs           → doit être vert
//   node scripts/mv-harnais-selection.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions extraites de src/utils.js et src/app.js (commentaires retirés), pas un double.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const UT = fs.readFileSync(path.join(R, 'src/utils.js'), 'utf8');
const APP = fs.readFileSync(path.join(R, 'src/app.js'), 'utf8');
const HTML = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const REG = fs.readFileSync(path.join(R, 'src/reglages.js'), 'utf8');

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
const UT_SEL = sansCom(bloc(UT, 'var MV_TACHES_SEL', 'window._mvSelResume       = _mvSelResume;', 'SEL-1 utils'));
const UT_DEP = [
  UT.match(/var MV_EX_MOIS_LBL = .*;/)[0],
  'var MV_CAMP_MOIS_DEF = 7;',
  fn(UT, 'function _mvCampagneMois(){'), fn(UT, 'function _mvCampagneDe(iso){'),
  fn(UT, 'function _mvCampagneBornes(c){'), fn(UT, 'function _saisonObj(nom){'),
  'function _mvAujIso(){ return window.__AUJ; }',
].join('\n');
const APP_SEL = sansCom(bloc(APP, '// ══════ SEL-1', 'function saveSelParc(){', 'SEL-1 app') + fn(APP, 'function saveSelParc(){').slice('function saveSelParc(){'.length));
const APP_CONC = fn(APP, 'function _mvExclu(p,nom,exclues){') + fn(APP, 'function _parcConcern(nomTache){');

function monde(ut, app, { admin = true, auj = '2026-10-02', visu = 'Automne', active = 'Automne' } = {}) {
  const toasts = [], log = [], els = {};
  const el = id => (els[id] ||= { id, value: '', textContent: '', innerHTML: '' });
  const ctx = {
    console, Date, Math, String, Number, Array, Object, JSON, parseInt, parseFloat, isNaN,
    __AUJ: auj,
    CONFIG: {},
    SAISONS: [{ nom: 'Hiver 2025', debut: '2025-11-01', fin: '2026-02-28' }, { nom: 'Automne', debut: '2026-09-01', fin: '2026-11-30', active: true }],
    PARCELLES: [
      { nom: 'A', surface: 0.5, statut: 'Active', taches: {} },
      { nom: 'B', surface: 1, statut: 'Active', taches: {}, tachesExclues: ['Arrachage', 'Pioche'] },
      { nom: 'C', surface: 0.25, statut: 'Arrachee', taches: {} },
      { nom: 'D', surface: 2, statut: 'Active', taches: {}, commune: { nom: 'Fixin' } }],
    JOURNAL: [],
    TACHES_CATALOGUE: [{ nom: 'Effeuillage', label: 'Effeuillage' }, { nom: 'Desherbage', label: 'Désherbage manuel' }, { nom: 'Arrachage', label: 'Arrachage' }],
    TRAVAUX: {},
    isAdmin: () => admin,
    getSaisonActive: () => ({ nom: active }),
    _visuSaison: () => visu,
    _escHtml: s => String(s), _escAttr: s => String(s),
    document: { getElementById: id => (id.startsWith('selp-') ? el(id) : null) },
    openOv: id => log.push('open:' + id), closeOv: (e, id) => log.push('close:' + id),
    showToast: m => toasts.push(m), saveData: k => log.push('save:' + k),
    recalcTravaux: n => log.push('recalc:' + n),
    renderParcelles: () => 0, computePStats: () => 0,
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(UT_DEP + '\n' + ut + '\nwindow._mvCampagneBornes=_mvCampagneBornes;\n' + app + '\n' + APP_CONC +
    '\nthis.__f={openSelParc,_mvSelPick,saveSelParc,_parcConcern,_mvExclu};', ctx);
  return { ctx, f: ctx.__f, toasts, log, el };
}

function suite(ut, app, tag) {
  const out = []; const T = (n, c) => out.push([tag + n, !!c]);
  const P = (w, n) => w.ctx.PARCELLES.find(x => x.nom === n);

  // 1. tâche ordinaire : règle historique
  let w = monde(ut, app);
  T('tâche ordinaire : concernée sauf exclusion', w.ctx._mvTacheConcerne(P(w, 'A'), 'Pioche') && !w.ctx._mvTacheConcerne(P(w, 'B'), 'Pioche'));
  // 2. tâche à la sélection : rien n'est concerné d'office
  T('sélection : aucune parcelle concernée sans choix', ['A', 'B', 'D'].every(n => !w.ctx._mvTacheConcerne(P(w, n), 'Effeuillage')));
  // 3. campagne du jour (02/10/2026 → 2026)
  T('campagne de référence = campagne du jour (2026)', w.ctx._mvCampRef() === 2026);
  w.ctx._mvSelPose(P(w, 'A'), 'Effeuillage', true);
  T('cochée pour 2026 → concernée', w.ctx._mvTacheConcerne(P(w, 'A'), 'Effeuillage') && P(w, 'A').selCamp.Effeuillage === 2026);
  T('cochée pour 2026 → PAS concernée en 2027', !w.ctx._mvTacheConcerne(P(w, 'A'), 'Effeuillage', 2027));
  // 4. exclusion permanente ignorée pour ces tâches
  w.ctx._mvSelPose(P(w, 'B'), 'Arrachage', true);
  T('p.tachesExclues ignoré pour une tâche à la sélection', w.ctx._mvTacheConcerne(P(w, 'B'), 'Arrachage'));
  // 5. décocher une tâche garde les autres, et vide l'objet quand plus rien
  w.ctx._mvSelPose(P(w, 'A'), 'Desherbage', true);
  w.ctx._mvSelPose(P(w, 'A'), 'Effeuillage', false);
  T('décocher garde les autres tâches', !P(w, 'A').selCamp.Effeuillage && P(w, 'A').selCamp.Desherbage === 2026);
  w.ctx._mvSelPose(P(w, 'A'), 'Desherbage', false);
  T('plus rien de coché → selCamp retiré', !('selCamp' in P(w, 'A')));
  T('_mvSelPose refuse une tâche ordinaire', w.ctx._mvSelPose(P(w, 'A'), 'Pioche', true) === false && !P(w, 'A').selCamp);
  // 6. le journal fait foi pendant la campagne
  w = monde(ut, app);
  w.ctx.JOURNAL.push({ id: 'a1', date: '2026-09-15', parcelle: 'D', tache: 'Effeuillage', statut: 'Valid\u00e9' });
  w.ctx.JOURNAL.push({ id: 'a2', date: '2026-06-15', parcelle: 'A', tache: 'Effeuillage', statut: 'Valid\u00e9' });
  w.ctx.JOURNAL.push({ id: 'a3', date: '2026-09-20', parcelle: 'A', tache: 'Desherbage', statut: 'Annul\u00e9' });
  w.ctx.JOURNAL.push({ id: 'a4', date: '2026-09-20', parcelle: 'A', tache: 'Desherbage', meteo: true, statut: 'Valid\u00e9' });
  T('saisie au journal cette campagne → concernée sans être cochée', w.ctx._mvTacheConcerne(P(w, 'D'), 'Effeuillage'));
  T('saisie de la campagne d\u2019avant → pas concernée', !w.ctx._mvTacheConcerne(P(w, 'A'), 'Effeuillage'));
  T('« Annulé » et météo ne comptent pas', !w.ctx._mvTacheConcerne(P(w, 'A'), 'Desherbage'));
  w.ctx.JOURNAL.unshift({ id: 'a5', date: '2026-10-01', parcelle: 'A', tache: 'Desherbage', statut: 'En cours' });
  T('une saisie neuve est vue (la mémoire suit le journal)', w.ctx._mvTacheConcerne(P(w, 'A'), 'Desherbage'));
  // 7. parcelle arrachée : l'arrachage seulement
  T('arrachée éligible à l\u2019arrachage', w.ctx._mvSelEligible(P(w, 'C'), 'Arrachage'));
  T('arrachée non éligible à l\u2019effeuillage', !w.ctx._mvSelEligible(P(w, 'C'), 'Effeuillage'));
  w.ctx._mvSelPose(P(w, 'C'), 'Arrachage', true);
  w.ctx._mvSelPose(P(w, 'C'), 'Effeuillage', true);
  const pcA = w.f._parcConcern('Arrachage').map(p => p.nom), pcE = w.f._parcConcern('Effeuillage').map(p => p.nom);
  T('_parcConcern(Arrachage) garde l\u2019arrachée choisie', pcA.includes('C'));
  T('_parcConcern(Effeuillage) écarte l\u2019arrachée', !pcE.includes('C') && pcE.includes('D'));
  T('_parcConcern(Pioche) inchangé (A, D)', w.f._parcConcern('Pioche').map(p => p.nom).join() === 'A,D');
  // 8. consultation d'une période archivée → sa campagne
  w = monde(ut, app, { visu: 'Hiver 2025' });
  T('période archivée consultée → campagne de son début (2025)', w.ctx._mvCampRef() === 2025);
  // 9. résumé
  w = monde(ut, app);
  w.ctx._mvSelPose(P(w, 'A'), 'Arrachage', true); w.ctx._mvSelPose(P(w, 'D'), 'Arrachage', true);
  const r = w.ctx._mvSelResume('Arrachage');
  T('résumé : 2 parcelles, 2,5 ha, campagne 2026–2027', r.n === 2 && r.ha === 2.5 && r.court === '2026\u20132027');
  // 10. la feuille
  w = monde(ut, app);
  w.ctx.JOURNAL.push({ id: 'b1', date: '2026-09-15', parcelle: 'D', tache: 'Effeuillage', statut: 'Valid\u00e9' });
  w.f.openSelParc('Effeuillage');
  const rows = w.el('selp-rows').innerHTML;
  T('feuille : ouverte, arrachée absente pour l\u2019effeuillage', w.log.includes('open:ovSelParc') && !rows.includes('data-selp-n="C"') && rows.includes('data-selp-n="A"'));
  T('feuille : parcelle déjà travaillée cochée d\u2019office', /data-selp-n="D"/.test(rows) && /pchk sel vert" data-selp-n="D"/.test(rows));
  w.f._mvSelPick({ getAttribute: () => 'A' });
  w.f._mvSelPick({ getAttribute: () => 'D' });
  T('feuille : une parcelle travaillée ne se décoche pas', w.toasts.some(m => /D\u00e9j\u00e0 travaill/.test(m)));
  w.f.saveSelParc();
  T('enregistrer : A cochée 2026, sauvé, recalculé', P(w, 'A').selCamp && P(w, 'A').selCamp.Effeuillage === 2026 && w.log.includes('save:parcelles') && w.log.includes('recalc:Effeuillage'));
  T('enregistrer : D reste concernée par le journal', w.ctx._mvTacheConcerne(P(w, 'D'), 'Effeuillage'));
  // 11. non-admin : rien ne s'ouvre, rien ne s'écrit — y compris si la feuille était restée ouverte
  w = monde(ut, app, { admin: false });
  w.f.openSelParc('Arrachage');
  T('non-admin : la feuille ne s\u2019ouvre pas', !w.log.includes('open:ovSelParc'));
  w = monde(ut, app);
  w.f.openSelParc('Arrachage'); w.f._mvSelPick({ getAttribute: () => 'A' });
  w.ctx.isAdmin = () => false;
  w.f.saveSelParc();
  T('non-admin : la garde est DANS l\u2019écriture (rien de sauvé)', !w.log.includes('save:parcelles') && !P(w, 'A').selCamp);
  // 12. câblage
  T('index.html porte la feuille ovSelParc', HTML.includes('id="ovSelParc"') && HTML.includes('id="selp-rows"') && HTML.includes('onclick="saveSelParc()"'));
  T('app.js expose les gestes de la feuille', ['openSelParc', '_mvSelRows', '_mvSelPick', 'saveSelParc'].every(n => APP.includes('window.' + n + ' = ' + n)));
  T('Réglages ouvre la feuille', REG.includes('window.openSelParc('));
  T('le journal propose une arrachée pour l\u2019arrachage', /je-parcelle[\s\S]{0,900}_mvTacheConcerne\(p,'Arrachage'\)/.test(APP));
  return out;
}

let ok = 0, ko = 0;
const res = suite(UT_SEL, APP_SEL, '');
res.forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nSEL-1 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) { console.log('base rouge : contre-épreuve sans objet'); process.exit(1); }

const DEFAUTS = [
  ['booléen au lieu du numéro de campagne', u => u.replace('if(on) s[nom] = c;', 'if(on) s[nom] = true;').replace('Number(s[nom]) === _mvCampNum(camp)', '!!s[nom]'), a => a],
  ['le journal ne compte plus', u => u.replace("return !!_mvSelTravaillees(c)[String(p.nom) + '\\u0000' + nom];", 'return false;'), a => a],
  ['p.tachesExclues relu pour ces tâches', u => u.replace('if(!p) return false;\n  if(!_mvTacheSel(nom))', "if(!p) return false;\n  if((p.tachesExclues||[]).indexOf(nom)>=0) return false;\n  if(!_mvTacheSel(nom))"), a => a],
  ['arrachée éligible à tout', u => u.replace("(p.statut !== 'Arrachee' || nom === 'Arrachage')", 'true'), a => a],
  ['campagne du jour même en archive', u => u.replace('if(vn && act && vn !== act){', 'if(false){'), a => a],
  ['« Annulé » compté', u => u.replace("if(st !== 'Valid\\u00e9' && st !== 'En cours') continue;", ''), a => a],
  ['garde admin retirée à l\u2019écriture', u => u, a => a.replace("function saveSelParc(){\n  if(!isAdmin()){ showToast('Admin requis','#B85A1A'); return; }", 'function saveSelParc(){')],
  ['le journal mémorisé pour toujours', u => u.replace(/var k = c \+ '\|' \+ J\.length[^\n]*;/, 'var k = String(c);'), a => a],
  ['la travaillée se décoche', u => u, a => a.replace("if(_SELP.trav[n]){ showToast(", "if(false){ showToast(")],
];
let rougies = 0;
DEFAUTS.forEach(([nom, fu, fa]) => {
  const u2 = fu(UT_SEL), a2 = fa(APP_SEL);
  if (u2 === UT_SEL && a2 === APP_SEL) { console.log('  ⚠ défaut non injecté (motif introuvable) : ' + nom); return; }
  let r2; try { r2 = suite(u2, a2, ''); } catch (e) { r2 = [['exception', false]]; }
  const rouge = r2.some(([, c]) => !c);
  if (rouge) rougies++; console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + nom);
});
console.log(`\n${rougies}/${DEFAUTS.length} contre-épreuves rougissent`);
process.exit(rougies === DEFAUTS.length ? 0 : 1);
