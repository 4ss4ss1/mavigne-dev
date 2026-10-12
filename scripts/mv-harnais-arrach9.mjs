// HARNAIS — ARRACH-9 (§317) : la parcelle d'arrachage « au prestataire » (l'équipe a fait toutes ses étapes) quitte les listes
//   et les cartes « à faire » de l'équipe, et reste validable depuis sa fiche.
//   node scripts/mv-harnais-arrach9.mjs           → doit être vert
//   node scripts/mv-harnais-arrach9.mjs --contre  → chaque défaut réinjecté doit rougir
// Exécute les VRAIES fonctions : le bloc ARRACH-3 d'app.js (_arrAuPrestataire, _mvAuPrestataire, _arrPrestaEnAttente,
// _pvVideTitre, _pvVideTexte), _pEtatTache / _pEtatLib / _pEtatBadge (app.js), _mvCibleCarte (utils.js) ; lit le branchement
// sur le texte des sources, commentaires retirés. Aucune écriture dans le dépôt : les contre-épreuves travaillent en mémoire.
import fs from 'fs'; import path from 'path'; import vm from 'vm';
import { fileURLToPath } from 'url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const L = f => fs.readFileSync(path.join(R, f), 'utf8');
const SRC0 = { app: L('src/app.js'), uti: L('src/utils.js'), pil: L('src/pilotage.js'), g04: L('guide/04-vigne.html') };
const sansCom = s => s.replace(/^\s*\/\/.*$/gm, '');
function fn(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n}\n', i) + 3); }
function ligne(src, re) { const m = src.match(re); if (!m) throw new Error('introuvable : ' + re); return m[0]; }
function fenetre(src, sig) { const i = src.indexOf(sig); if (i < 0) throw new Error('introuvable : ' + sig); return src.slice(i, src.indexOf('\n};\n', i) + 4); }
const ETAPES = [{ id: 'demontage', lbl: 'Démontage' }, { id: 'souches', lbl: 'Souches', presta: true }, { id: 'ramassage', lbl: 'Ramassage', presta: true }];

function mondeA(S, etapes) {
  const A = S.app, blk = sansCom(A.slice(A.indexOf('// ══════ ARRACH-3'), A.indexOf('// ══════ ARRACHAGE —')));
  const ctx = { console, Math, String, Number, Array, Object, JSON, parseInt, parseFloat, isFinite, Date,
    CONFIG: { arrachage: { etapes: etapes || ETAPES, apres: 'souches' } },
    PARCELLES: [
      { nom: 'Bras', surface: 0.1, statut: 'Plantée', taches: { Arrachage: 'En cours' }, arrEtapes: { c: 2026, f: { demontage: { d: '2026-10-01' } } } },
      { nom: 'Charreux', surface: 0.2, statut: 'Plantée', taches: {}, arrEtapes: { c: 2026, f: {} } },
      { nom: 'Ouche', surface: 0.3, statut: 'Arrachee', taches: { Arrachage: 'Validé' }, arrEtapes: { c: 2026, f: { demontage: { d: '2026-10-01' }, souches: { d: '2026-10-05' }, ramassage: { d: '2026-10-06' } } } }],
    JOURNAL: [], TRAVAUX: {}, _mvCampRef: () => 2026, _escHtml: s => String(s).replace(/</g, '&lt;'), _escAttr: s => String(s), fmtDate: d => d, _mvIcon: () => '',
    tNom: n => ({ Reparation: 'Réparation' }[n] || n), getTachesSaison: () => [{ nom: 'Arrachage' }], getTacheStatut: (p, n) => (p.taches[n] || 'Non démarré'),
    _visuSaison: () => '', getSaisonActive: () => ({}), _mvExclu: () => false, currentUser: { nom: 'Nico' }, _prioItems: () => [],
    pTacheFilter: 'Arrachage', _mvBadge: (t, c) => t + '|' + c };
  ctx._parcConcern = n => ctx.PARCELLES.filter(p => n === 'Arrachage' || p.statut !== 'Arrachee');
  ctx._pvCurDone = (p, T) => ctx.getTacheStatut(p, T) === 'Validé';
  ctx._pvCurStarted = (p, T) => ctx.getTacheStatut(p, T) === 'En cours';
  ctx.window = ctx; vm.createContext(ctx);
  const ext = ['_pEtatBadge\\(e\\)', '_pEtatTache\\(p\\)', '_pEtatLib\\(e\\)'].map(s => ligne(A, new RegExp('function ' + s + '\\{[^\\n]*\\n'))).join('');
  vm.runInContext(blk + '\n' + ext + '\nthis.__f={_arrAuPrestataire,_pvAuPresta,_arrPrestaEnAttente,_pvVideTitre,_pvVideTexte,_pEtatTache,_pEtatLib,_pEtatBadge};', ctx);
  return { ctx, f: ctx.__f, P: ctx.PARCELLES };
}
function mondeCible(S, avecPresta) {
  const ps = [{ nom: 'P1', statut: 'Plantée', e: 'commencee', presta: true }, { nom: 'P2', statut: 'Plantée', e: 'a-faire' }, { nom: 'P3', statut: 'Plantée', e: 'finie' }];
  const ctx = { PARCELLES: ps, Array, Object, String };
  ctx.window = ctx;
  ctx._mvVueActive = () => true; ctx._mvTacheExclue = () => false;
  ctx._mvTacheEtat = (p, T) => (T === 'Arrachage' ? p.e : 'a-faire');
  ctx._mvOrdreFor = T => ({ ordre: ['P3', 'P1', 'P2'] });
  if (avecPresta) ctx._mvAuPrestataire = (p, T) => T === 'Arrachage' && !!p.presta;   // lit ses deux arguments
  vm.createContext(ctx); vm.runInContext(fenetre(S.uti, 'window._mvCibleCarte = function(T){'), ctx);
  return ctx;
}

function suite(S) {
  const out = []; const T = (n, f) => { let c = false; try { c = !!f(); } catch (e) { c = false; n += ' — PLANTE : ' + e.message; } out.push([n, c]); };
  const A = sansCom(S.app);
  // ── la règle ──
  T('démontage fait, souches et ramassage au prestataire : la parcelle est « au prestataire »', () => { const w = mondeA(S); return w.f._arrAuPrestataire(w.P[0]) === true && w.ctx._mvAuPrestataire(w.P[0], 'Arrachage') === true; });
  T('… pour l\u2019arrachage seulement (une autre tâche ne la lit pas)', () => { const w = mondeA(S); return w.ctx._mvAuPrestataire(w.P[0], 'Taille') === false && w.f._pvAuPresta(w.P[0], 'Taille') === false; });
  T('rien de fait : pas au prestataire', () => { const w = mondeA(S); return w.f._arrAuPrestataire(w.P[1]) === false; });
  T('validée en entier : plus au prestataire (elle est finie, tout court)', () => { const w = mondeA(S); return w.f._arrAuPrestataire(w.P[2]) === false; });
  T('sans découpage en étapes : rien ne change', () => { const w = mondeA(S, []); return w.f._arrAuPrestataire(w.P[0]) === false && w.f._arrPrestaEnAttente() === false; });
  T('toutes les étapes au prestataire : rien n\u2019attend l\u2019équipe, la parcelle est au prestataire tout de suite', () => { const w = mondeA(S, ETAPES.map(e => Object.assign({}, e, { presta: true }))); return w.f._arrAuPrestataire(w.P[1]) === true; });
  T('une parcelle sans données : non, sans planter', () => { const w = mondeA(S); return w.f._arrAuPrestataire(null) === false; });
  // ── ce que dit la liste ──
  T('l\u2019état écrit : « fini pour l\u2019équipe, au prestataire », badge « Au prestataire » ; les autres inchangés', () => { const w = mondeA(S);
    return w.f._pEtatTache(w.P[0]) === 'presta' && w.f._pEtatLib('presta') === 'fini pour l\u2019équipe, au prestataire' && w.f._pEtatBadge('presta') === 'Au prestataire|neutre'
      && w.f._pEtatTache(w.P[1]) === 'afaire' && w.f._pEtatTache(w.P[2]) === 'fait' && w.f._pEtatLib('cours') === 'en cours' && w.f._pEtatBadge('fait') === 'Fait|vert'; });
  T('la liste « À faire » vide : « Arrachage fini pour l\u2019équipe », la suite au prestataire, « Toutes » montre les parcelles', () => { const w = mondeA(S);
    return w.f._arrPrestaEnAttente() === true && w.f._pvVideTitre('Arrachage') === 'Arrachage fini pour l\u2019équipe' && w.f._pvVideTexte('Arrachage') === 'La suite est au prestataire. «\u00a0Toutes\u00a0» montre les parcelles.'; });
  T('… une autre tâche : « terminé sur toutes les parcelles », son nom en clair et échappé', () => { const w = mondeA(S);
    return w.f._pvVideTitre('Reparation') === 'Réparation terminé' && w.f._pvVideTitre('<b>') === '&lt;b> terminé' && /^Cette tâche est terminée sur toutes les parcelles de la saison.{0,2}!$/.test(w.f._pvVideTexte('Reparation')); });
  T('… un arrachage sans parcelle au prestataire : le texte d\u2019avant', () => { const w = mondeA(S); w.P[0].arrEtapes.f = {}; return w.f._arrPrestaEnAttente() === false && w.f._pvVideTitre('Arrachage') === 'Arrachage terminé'; });
  // ── l'anneau des cartes (utils.js) ──
  T('l\u2019anneau : une parcelle au prestataire n\u2019est plus « commencée », ni la prochaine — la suivante de la tournée l\u2019est', () => { const c = mondeCible(S, true), r = c._mvCibleCarte('Arrachage');
    return r && r.etat === 'prochaine' && r.ps.length === 1 && r.ps[0].nom === 'P2'; });
  T('… sans app.js (lecture absente) : le comportement d\u2019avant', () => { const r = mondeCible(S, false)._mvCibleCarte('Arrachage'); return r && r.etat === 'commencee' && r.ps[0].nom === 'P1'; });
  // ── le branchement (texte des sources, commentaires retirés) ──
  T('Parcelles : au prestataire = hors de « À faire », visible sous « Toutes »', () => A.includes("if(!window.pShowDone&&(_pvCurDone(p,pTacheFilter)||(pTacheFilter==='Arrachage'&&_pvAuPresta(p,pTacheFilter))))return false;"));
  T('… plus en tête comme une parcelle commencée, rangée avec les faites', () => A.includes("const ca=(_pvCurStarted(a,pTacheFilter)&&!(pTacheFilter==='Arrachage'&&_pvAuPresta(a,pTacheFilter)))?0:1, cb=(_pvCurStarted(b,pTacheFilter)&&!(pTacheFilter==='Arrachage'&&_pvAuPresta(b,pTacheFilter)))?0:1;")
    && A.includes("const da=(_pvCurDone(a,pTacheFilter)||(pTacheFilter==='Arrachage'&&_pvAuPresta(a,pTacheFilter)))?1:0, db=(_pvCurDone(b,pTacheFilter)||(pTacheFilter==='Arrachage'&&_pvAuPresta(b,pTacheFilter)))?1:0;"));
  T('… la ligne et la carte disent l\u2019état (habit de « fait »), la fiche aussi', () => (A.match(/lb=_pEtatLib\(e\);/g) || []).length === 2 && A.includes("prow-'+(e==='presta'?'fait':e)+'") && A.includes("pcq-'+(e==='presta'?'fait':e)+'")
    && A.includes("e=_pvAuPresta(p,t.nom)?'presta':(st==="));
  T('… la puce « Arrachage » rejoint les tâches finies quand l\u2019équipe a fini partout', () => A.includes("const doneA=(a.nom==='Arrachage'&&_arrEquipeFiniePartout())||") && A.includes("const doneB=(b.nom==='Arrachage'&&_arrEquipeFiniePartout())||"));
  T('… la liste vide parle de l\u2019équipe et du prestataire', () => A.includes('<div class="et">${_pvVideTitre(pTacheFilter)}</div>') && A.includes('<div class="ed">${_pvVideTexte(pTacheFilter)}</div>'));
  T('la carte de l\u2019Accueil : au prestataire = fait pour l\u2019équipe', () => /function _homePrioCarte\(\)\{[\s\S]*?if\(t\)\{ if\(t==='Arrachage'&&_pvAuPresta\(p,t\)\) return 'fait';/.test(A));
  T('la tournée de Décider ne la propose plus, son anneau non plus', () => { const P = sansCom(S.pil);
    return fn(P, 'function _dzRowsTache(t){').includes("&&!(typeof window._mvAuPrestataire==='function'&&window._mvAuPrestataire(p,t))")
      && P.includes("window._mvTacheEtat(r.p,t)==='commencee'&&!(typeof window._mvAuPrestataire==='function'&&window._mvAuPrestataire(r.p,t))"); });
  T('le bouton Fait / Annuler ne change pas (_mvTacheEtat et _pvCurDone ne lisent pas le prestataire)', () => !/_pvAuPresta|_mvAuPrestataire|_arrAuPrestataire/.test(fn(A, 'function _pvCurDone(p,nom)'.slice(0, 26)) + fenetre(S.uti, 'window._mvTacheEtat = function(p, T){')));
  // ── l'accompagnement ──
  T('l\u2019aide des Parcelles, le guide et les nouveautés le disent', () => S.uti.includes("['L’arrachage au prestataire', \"dans la liste filtrée sur l’arrachage")
    && S.g04.includes('quitte «\u00a0À faire\u00a0» : «\u00a0Toutes\u00a0» la montre, marquée «\u00a0Au prestataire\u00a0»')
    && (() => { const i = S.uti.indexOf("{ v: '8.85', d: '2026-10-12', items: ["), j = S.uti.indexOf("{ v: '8.84'", i); return i > 0 && j > i && S.uti.slice(i, j).includes('marquée «\u00a0Au prestataire\u00a0»'); })());   // le bloc, pas la tête : le lot suivant prépend le sien
  return out;
}
let ok = 0, ko = 0;
suite(SRC0).forEach(([n, c]) => { if (c) { ok++; console.log('  \u2713 ' + n); } else { ko++; console.log('  \u2717 ' + n); } });
console.log(`\nARRACH-9 : ${ok} vertes, ${ko} rouges`);
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) process.exit(1);
const sub = (k, a, b) => { const S = Object.assign({}, SRC0); if (!S[k].includes(a)) throw new Error('contre-épreuve sans ancre : ' + a.slice(0, 60)); S[k] = S[k].split(a).join(b); return S; };
const CONTRES = [
  ['une parcelle validée reste « au prestataire »', () => sub('app', "if(!p||!_arrActif()||getTacheStatut(p,'Arrachage')==='Valid\\u00e9') return false;", "if(!p||!_arrActif()) return false;")],
  ['toute parcelle découpée est « au prestataire »', () => sub('app', "  return _arrEquipeFinie(p);\n}\nfunction _pvAuPresta", "  return true;\n}\nfunction _pvAuPresta")],
  ['« À faire » garde la parcelle', () => sub('app', "(_pvCurDone(p,pTacheFilter)||(pTacheFilter==='Arrachage'&&_pvAuPresta(p,pTacheFilter)))", '_pvCurDone(p,pTacheFilter)')],
  ['elle repasse en tête comme commencée', () => sub('app', "(_pvCurStarted(a,pTacheFilter)&&!(pTacheFilter==='Arrachage'&&_pvAuPresta(a,pTacheFilter)))", '_pvCurStarted(a,pTacheFilter)')],
  ['la ligne redit « en cours »', () => sub('app', "(_pvAuPresta(p,pTacheFilter)?'presta':(_pvCurStarted(p,pTacheFilter)?'cours':'afaire'))", "(_pvCurStarted(p,pTacheFilter)?'cours':'afaire')")],
  ['l\u2019anneau la reprend comme commencée', () => sub('uti', "=== 'commencee' && !presta(p); });", "=== 'commencee'; });")],
  ['l\u2019anneau la reprend comme prochaine', () => sub('uti', "!== 'finie' && !presta(p)) return", "!== 'finie') return")],
  ['la tournée la propose', () => sub('pil', "_opParcReste(p,def)>0.05&&!(typeof window._mvAuPrestataire==='function'&&window._mvAuPrestataire(p,t)); })", "_opParcReste(p,def)>0.05; })")],
  ['l\u2019Accueil la redit en cours', () => sub('app', "if(t){ if(t==='Arrachage'&&_pvAuPresta(p,t)) return 'fait';", 'if(t){')],
  ['la liste vide redit « terminé »', () => sub('app', "'Arrachage fini pour l\\u2019\\u00e9quipe'", "_escHtml(tNom(T))+' termin\\u00e9'")],
  ['la puce reste parmi les tâches à faire', () => sub('app', "const doneA=(a.nom==='Arrachage'&&_arrEquipeFiniePartout())||", 'const doneA=')],
];
let mord = 0, muet = 0;
CONTRES.forEach(([n, mk]) => { let rouge = false; try { rouge = suite(mk()).some(([, c]) => !c); } catch (e) { rouge = true; }
  if (rouge) { mord++; console.log('  \u2713 contre-épreuve rouge : ' + n); } else { muet++; console.log('  \u2717 contre-épreuve MUETTE : ' + n); } });
console.log(`\nARRACH-9 contre-épreuves : ${mord}/${CONTRES.length} mordent`);
process.exit(muet ? 1 : 0);
