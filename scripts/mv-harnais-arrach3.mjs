// HARNAIS — ARRACH-3 : l'arrachage en étapes composées par l'admin.
//   node scripts/mv-harnais-arrach3.mjs           → doit être vert
//   node scripts/mv-harnais-arrach3.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions extraites de src/app.js et src/pilotage.js (commentaires retirés), pas un double.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const APP = fs.readFileSync(path.join(R, 'src/app.js'), 'utf8');
const PIL = fs.readFileSync(path.join(R, 'src/pilotage.js'), 'utf8');
const HTML = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const REG = fs.readFileSync(path.join(R, 'src/reglages.js'), 'utf8');
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) {
  const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig);
  const j = src.indexOf('\n}\n', i); return src.slice(i, j + 3);
}
const i0 = APP.indexOf('// ══════ ARRACH-3'), i1 = APP.indexOf('// ══════ ARRACHAGE —');
if (i0 < 0 || i1 < i0) throw new Error('bloc ARRACH-3 introuvable');
const BLK = sansCom(APP.slice(i0, i1));
const TV = sansCom(fn(PIL, 'function _ecoTvNivs(j, cle){') + fn(PIL, 'function _ecoTvEvents(d0, d1){'));

// COH-1 (§222) : les feuilles d'arrachage écrivent la surface par _pvSurfFr (4 décimales) — la vraie fonction, extraite.
const PVSURF = APP.match(/function _pvSurfFr\(s\)\{[^\n]*\n/)[0];
function monde(blk, tv, { admin = true, actif = true, cfg } = {}) {
  const toasts = [], log = [], els = {};
  const el = id => (els[id] ||= { id, value: '', textContent: '', innerHTML: '', style: {} });
  const ctx = {
    console, Date, Math, String, Number, Array, Object, JSON, parseInt, parseFloat, isFinite, setTimeout: f => { log.push('timer'); f(); },
    CONFIG: cfg === undefined ? { arrachage: { etapes: [{ id: 'demontage', lbl: 'Démontage du palissage' }, { id: 'souches', lbl: 'Arrachage des souches' }, { id: 'ramassage', lbl: 'Ramassage des souches', presta: true }], apres: 'souches' } } : cfg,
    PARCELLES: [{ nom: 'Les Grandes Vignes', surface: 0.42, statut: 'Active', taches: {} }, { nom: 'Clos', surface: 1, statut: 'Active', taches: {} }],
    JOURNAL: [], TRAVAUX: {},
    currentUser: { nom: 'Nico' },
    isAdmin: () => admin, canWrite: () => true, _mvValidBlocked: () => false, _mvOnActiveSaison: () => actif,
    _mvToday: () => '2026-10-02', fmtDate: d => d, _mvIcon: () => '', _escHtml: s => String(s), _escAttr: s => String(s),
    _mvCampRef: () => 2026, _mvEqApplique: e => e,
    document: { getElementById: id => (/^(arre|arrcf|arr-)/.test(id) ? el(id) : null) },
    openOv: id => log.push('open:' + id), closeOv: (e, id) => log.push('close:' + id),
    showToast: m => toasts.push(m), saveData: k => log.push('save:' + k),
    recalcTravaux: n => log.push('recalc:' + n), openDP: n => log.push('openDP:' + n),
    openDPArrachage: () => log.push('proposeArrachee'),
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(PVSURF + blk + '\n' + tv + '\nthis.__f={_arrCfg,_arrActif,_arrStatutTache,openArrEtape,saveArrEtape,annulerArrEtape,openArrCfg,_arrCfgOp,_arrCfgAjout,saveArrCfg,_arrRowHtml,_ecoTvEvents};', ctx);
  return { ctx, f: ctx.__f, toasts, log, el };
}
const P = (w, n = 'Les Grandes Vignes') => w.ctx.PARCELLES.find(x => x.nom === n);
function valide(w, id, date = '2026-10-01', opt = {}) {
  w.f.openArrEtape(opt.nom || 'Les Grandes Vignes', id);
  w.el('arre-date').value = date;
  if (opt.pn) w.el('arre-pn').value = opt.pn;
  if (opt.pm) w.el('arre-pm').value = opt.pm;
  w.f.saveArrEtape();
}

function suite(blk, tv) {
  const out = []; const T = (n, c) => out.push([n, !!c]);
  // 1. sans réglage : rien ne change
  let w = monde(blk, tv, { cfg: {} });
  T('sans étape réglée : arrachage en une fois (inactif)', !w.f._arrActif());
  // 2. réglage lu
  w = monde(blk, tv);
  T('réglage : 3 étapes, ramassage prestataire, « Arrachée » après les souches', w.f._arrCfg().etapes.length === 3 && w.f._arrCfg().etapes[2].presta && w.f._arrCfg().apres === 'souches');
  T('une étape inconnue comme repère retombe sur les souches', monde(blk, tv, { cfg: { arrachage: { etapes: [{ id: 'souches', lbl: 'S' }], apres: 'zzz' } } }).f._arrCfg().apres === 'souches');
  // 3. valider une étape
  valide(w, 'demontage');
  const j0 = w.ctx.JOURNAL[0];
  T('étape 1 : une entrée de journal Arrachage + étape', j0 && j0.tache === 'Arrachage' && j0.etape === 'demontage' && j0.statut === 'Validé' && !j0.presta);
  T('étape 1 : la tâche passe « En cours »', P(w).taches.Arrachage === 'En cours' && P(w).arrEtapes.c === 2026 && P(w).arrEtapes.f.demontage.d === '2026-10-01');
  T('étape 1 : pas de proposition « Arrachée »', !w.log.includes('proposeArrachee'));
  valide(w, 'souches', '2026-10-02');
  T('étape choisie (souches) validée : « Arrachée » proposé', w.log.includes('proposeArrachee') && w.el('arr-date').value === '2026-10-02');
  valide(w, 'ramassage', '2026-10-02', { pn: 'ETA Morey', pm: '1200,50' });
  const j2 = w.ctx.JOURNAL[0];
  T('étape prestataire : presta, nom et montant notés', j2.presta === true && j2.prestaNom === 'ETA Morey' && j2.prestaMontant === 1200.5);
  T('toutes les étapes : la tâche passe « Validé »', P(w).taches.Arrachage === 'Validé');
  // 4. le temps réel
  const E = w.f._ecoTvEvents('2026-09-01', '2026-10-31').ev;
  T('temps réel : l\u2019étape prestataire n\u2019absorbe aucune heure', E.length === 2 && E.every(e => e.etape !== 'ramassage'));
  T('temps réel : deux étapes différentes ne sont pas une revalidation', E.every(e => !e.dup) && E.map(e => e.etape).join() === 'demontage,souches');
  // 5. annuler une étape (admin)
  w.f.openArrEtape('Les Grandes Vignes', 'demontage'); w.f.annulerArrEtape();
  T('annuler : l\u2019étape sort, la tâche repasse « En cours »', !P(w).arrEtapes.f.demontage && P(w).taches.Arrachage === 'En cours');
  const E2 = w.f._ecoTvEvents('2026-09-01', '2026-10-31').ev;
  T('annuler : seule cette étape quitte le temps réel', E2.length === 1 && E2[0].etape === 'souches');
  // 6. non-admin : valide, mais n'annule pas, ne règle pas, aucune proposition
  w = monde(blk, tv, { admin: false });
  valide(w, 'souches');
  T('non-admin : valide une étape, sans proposition « Arrachée »', P(w).arrEtapes.f.souches && !w.log.includes('proposeArrachee'));
  w.f.openArrEtape('Les Grandes Vignes', 'souches'); w.f.annulerArrEtape();
  T('non-admin : ne peut pas annuler', !!P(w).arrEtapes.f.souches);
  w.f.saveArrCfg();
  T('non-admin : ne règle pas l\u2019arrachage', !w.log.includes('save:config'));
  // 7. date future refusée
  w = monde(blk, tv); valide(w, 'demontage', '2026-12-01');
  T('date future refusée', !P(w).arrEtapes && !w.ctx.JOURNAL.length);
  // 8. campagne suivante : l'état tombe
  w = monde(blk, tv); valide(w, 'demontage'); w.ctx._mvCampRef = () => 2027;
  T('campagne suivante : aucune étape faite', w.f._arrStatutTache(P(w)) === 'Non démarré');
  // 9. période consultée non active : le statut de la période n'est pas réécrit
  w = monde(blk, tv, { actif: false }); valide(w, 'demontage');
  T('archive consultée : p.taches intouché', P(w).taches.Arrachage === undefined);
  // 10. le réglage
  w = monde(blk, tv, { cfg: {} });
  w.f.openArrCfg();
  w.f._arrCfgOp(0, 'on'); w.f._arrCfgOp(1, 'on'); w.f._arrCfgOp(2, 'on'); w.f._arrCfgOp(2, 'presta');
  w.el('arrcf-new').value = 'Broyage'; w.f._arrCfgAjout();
  w.f._arrCfgOp(5, 'up');
  w.el('arrcf-apres').value = '*';
  w.f.saveArrCfg();
  const C = w.ctx.CONFIG.arrachage;
  T('réglage : 4 étapes cochées, dans l\u2019ordre, prestataire posé', C && C.etapes.map(e => e.lbl).join('|') === 'Démontage du palissage|Arrachage des souches|Ramassage des souches|Broyage' && C.etapes[2].presta && C.apres === '*' && w.log.includes('save:config'));
  w.f.openArrCfg(); [0, 1, 2, 3].forEach(i => w.f._arrCfgOp(i, 'on')); w.f.saveArrCfg();
  T('réglage : tout décocher = arrachage en une fois', !w.ctx.CONFIG.arrachage);
  // 11. câblage
  T('index.html porte les deux feuilles', HTML.includes('id="ovArrEtape"') && HTML.includes('id="ovArrCfg"') && HTML.includes('onclick="saveArrEtape()"'));
  T('app.js expose les gestes', ['openArrEtape', 'saveArrEtape', 'annulerArrEtape', 'openArrCfg', '_arrCfgOp', '_arrCfgAjout', 'saveArrCfg'].every(n => APP.includes('window.' + n + ' = ' + n)));
  T('la fiche affiche les étapes', /t\.nom==='Arrachage'&&_arrActif\(\)\) return _arrRowHtml\(p,canEdit\)/.test(APP));
  T('Réglages ouvre le réglage des étapes', REG.includes('window.openArrCfg()'));
  T('le temps réel affiche les étapes sous l\u2019arrachage', /t\.nom==='Arrachage'\)\?\(V\.etapes/.test(PIL));
  return out;
}
let ok = 0, ko = 0;
suite(BLK, TV).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nARRACH-3 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const D = [
  ['le prestataire absorbe les heures', b => b, t => t.replace('!j.presta && ', '')],
  ['une étape annulée vise le dernier arrachage', b => b, t => t.replace("+(j.etape?('\\u0000'+j.etape):'')", '')],
  ['« Arrachée » proposé à chaque étape', b => b.replace("(cfg.apres==='*'?tout:cfg.apres===e.id)", 'true'), t => t],
  // ARRACH-6 : la garde vit à DEUX endroits (saveArrEtape et _arrProposer) — le défaut retire les deux.
  ['« Arrachée » proposé à un salarié', b => b.replace("p.statut!=='Arrachee'&&isAdmin()&&", "p.statut!=='Arrachee'&&").replace("function _arrProposer(nom,date){\n  if(!isAdmin()) return false;", 'function _arrProposer(nom,date){'), t => t],
  ['la tâche validée dès la première étape', b => b.replace("n===0?'Non d\\u00e9marr\\u00e9':(n>=N?'Valid\\u00e9':'En cours')", "n===0?'Non d\\u00e9marr\\u00e9':'Valid\\u00e9'"), t => t],
  ['l\u2019état survit à la campagne', b => b.replace('(s&&Number(s.c)===c&&s.f', '(s&&s.f'), t => t],
  ['garde admin retirée de l\u2019annulation', b => b.replace("function annulerArrEtape(){\n  if(!isAdmin()){ showToast('Admin requis','#B85A1A'); return; }", 'function annulerArrEtape(){'), t => t],
  ['date future acceptée', b => b.replace("if(date>_mvToday()){ showToast('Date dans le futur','#B85A1A'); return; }", ''), t => t],
  ['montant oublié', b => b.replace('if(pm>0){ j.prestaMontant', 'if(false){ j.prestaMontant'), t => t],
  ['statut écrit en archive', b => b.replace("if(typeof _mvOnActiveSaison==='function'&&!_mvOnActiveSaison()) return;", ''), t => t],
];
let r = 0;
D.forEach(([n, fb, ft]) => {
  const b2 = fb(BLK), t2 = ft(TV);
  if (b2 === BLK && t2 === TV) { console.log('  ⚠ défaut non injecté : ' + n); return; }
  let res; try { res = suite(b2, t2); } catch (e) { res = [['exc', false]]; }
  const rouge = res.some(([, c]) => !c); if (rouge) r++;
  console.log((rouge ? '  ✓ rougit : ' : '  ✗ RESTE VERT : ') + n);
});
console.log(`\n${r}/${D.length} contre-épreuves rougissent`);
process.exit(r === D.length ? 0 : 1);
