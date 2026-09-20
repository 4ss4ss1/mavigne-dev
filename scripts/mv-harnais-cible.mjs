/* ───────────────────────────────────────────────────────────────────────────
   HARNAIS — CE QUE LES CARTES MONTRENT (lot CIBLE-1, §163)
   Lancer : node scripts/mv-harnais-cible.mjs
            node scripts/mv-harnais-cible.mjs --contre

   ══ POURQUOI ══
   Quatre cartes entourent une parcelle d'un anneau : celle qui est COMMENCÉE et
   pas finie, sinon la PROCHAINE à faire — le n°1 de la tournée enregistrée dans
   Décider. Trois notions se croisent là : l'état d'une tâche sur une parcelle
   (qui se lit à l'étape en cours), la priorité du moment, et l'ordre de la
   tournée. Chacune vivait déjà quelque part ; le risque est qu'une carte la
   relise à sa façon.
   Le même lot répare le départ de la tournée, qui retenait la PREMIÈRE parcelle
   validée du jour : `>=` sur la date seule, journal rangé du plus récent au plus
   ancien. Le défaut existait DEUX fois (`_opJournalLast`, et `_dzDernierFait`
   ajouté par DZ-1).

   ══ CE QU'IL TIENT ══
     A. On EXÉCUTE les vraies définitions extraites de src/utils.js :
        `_mvTacheEtat`, `_mvCibleCarte`, `_mvTachePrio`, `_mvDerniereValidee`,
        `_mvVueActive` — sur des parcelles et des journaux fabriqués.
     B. Les appelants (lus sans commentaires, §34g) : aucune copie privée ne
        subsiste dans pilotage.js ; l'écran Vigne lit le même état que les
        cartes ; chaque carte appelle la définition ; l'anneau n'est pas
        cliquable ; la feuille l'anime ET le fige en mouvement réduit.

   ⚠️ §25.2 : les contre-épreuves mutent EN MÉMOIRE, avec garde d'injection —
      une mutation qui ne trouve pas son ancre est une ERREUR, jamais un vert.
   ─────────────────────────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ICI    = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');
const CONTRE = process.argv.includes('--contre');
const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');
const BASE = { utils: lire('src/utils.js'), app: lire('src/app.js'), pil: lire('src/pilotage.js'), css: lire('src/styles.css') };

/* ── Lecture ─────────────────────────────────────────────────────────────── */
function defWindow(src, nom) {
  const i = src.indexOf('window.' + nom + ' = function');
  if (i < 0) return '';
  const j = src.indexOf('\n};\n', i);
  return j < 0 ? '' : src.slice(i, j + 3);
}
const nu = s => s.split('\n').filter(l => !l.trimStart().startsWith('//')).join('\n');
function corps(src, nom) {
  const P = nu(src);
  const i = P.indexOf('function ' + nom + '(');
  if (i < 0) return '';
  let d = 0; const s = P.indexOf('{', i);
  for (let k = s; k < P.length; k++) {
    if (P[k] === '{') d++;
    else if (P[k] === '}') { d--; if (!d) return P.slice(s, k + 1); }
  }
  return '';
}

/* ── Le bac : les primitives de l'écran Vigne, telles qu'app.js les expose ── */
function bac(S, etat) {
  const w = Object.assign({ _mvAvale() {} }, etat);
  w._pvType = T => (w.__types && w.__types[T]) || 'simple';
  w._tachesFor = p => (p && p.taches) || {};
  w.getTacheStatut = (p, T) => w._tachesFor(p)[T] || 'Non démarré';
  w._pvEtapeCourante = () => (w.__etape || 1);
  w._pvEffPlan = (p, T) => { const s = w._tachesFor(p)[T]; return (s && s.ov != null) ? s.ov : (w.__plan || 3); };
  w._pvStepState = (p, T, i) => { const s = w._tachesFor(p)[T]; return (s && typeof s === 'object' && s['p' + i]) || 'Non démarré'; };
  const ctx = { window: w };
  vm.createContext(ctx);
  vm.runInContext([S.defEtat, S.defPrio, S.defCible, S.defVue, S.defDern, S.defOrdreMap, S.defOrdreFor].join('\n'), ctx);
  return ctx.window;
}
const P = (nom, taches) => ({ nom, surface: 0.4, taches: taches || {} });
const ordreCfg = (T, ordre) => ({ ordre_passage_t: { [T]: { date: '2026-09-18', ordre } } });

/* ── A. Les définitions, exécutées ───────────────────────────────────────── */
function scenarios(S) {
  const R = [];
  const cible = (parc, cfg, T, extra) => {
    const w = bac(S, Object.assign({ PARCELLES: parc, CONFIG: cfg || {}, JOURNAL: [] }, extra || {}));
    const c = w._mvCibleCarte(T);
    return c ? c.etat + ':' + c.ps.map(p => p.nom).join(',') : null;
  };
  const T = 'Ebourgeonnage', ORD = ['A', 'B', 'C', 'D'];
  const parc = n => ORD.map(x => P(x, n[x] ? { [T]: n[x] } : {}));

  R.push(['rien de commencé : l\'anneau va sur le n°1 de la tournée enregistrée',
    cible(parc({}), ordreCfg(T, ORD), T) === 'prochaine:A']);
  R.push(['le n°1 fini : la prochaine est la suivante de l\'ordre',
    cible(parc({ A: 'Validé' }), ordreCfg(T, ORD), T) === 'prochaine:B']);
  R.push(['une parcelle commencée passe devant la prochaine',
    cible(parc({ A: 'Validé', C: 'En cours' }), ordreCfg(T, ORD), T) === 'commencee:C']);
  R.push(['deux parcelles commencées : deux anneaux, aucune cachée',
    cible(parc({ B: 'En cours', D: 'En cours' }), ordreCfg(T, ORD), T) === 'commencee:B,D']);
  R.push(['une commencée compte même sans tournée enregistrée',
    cible(parc({ C: 'En cours' }), {}, T) === 'commencee:C']);
  R.push(['sans tournée enregistrée et rien de commencé : pas d\'anneau (personne n\'a dit par où commencer)',
    cible(parc({}), {}, T) === null]);
  R.push(['tout fini : pas d\'anneau',
    cible(parc({ A: 'Validé', B: 'Validé', C: 'Validé', D: 'Validé' }), ordreCfg(T, ORD), T) === null]);
  R.push(['une parcelle arrachée n\'est ni commencée ni prochaine', (() => {
    const ps = parc({ A: 'En cours' }); ps[0].statut = 'Arrachee';
    return cible(ps, ordreCfg(T, ORD), T) === 'prochaine:B';
  })()]);
  R.push(['une tâche désactivée sur la parcelle l\'écarte aussi', (() => {
    const ps = parc({ A: 'En cours' }); ps[0].tachesExclues = [T];
    return cible(ps, ordreCfg(T, ORD), T) === 'prochaine:B';
  })()]);
  R.push(['une parcelle hors tournée (ajoutée depuis) n\'est pas la prochaine',
    cible(parc({}), ordreCfg(T, ['Z', 'B']), T) === 'prochaine:B']);
  R.push(['sur une période archivée, aucun anneau',
    cible(parc({ C: 'En cours' }), ordreCfg(T, ORD), T,
      { getSaisonActive: () => ({ nom: 'Saison 2026' }), _visuSaison: () => 'Saison 2025' }) === null]);
  R.push(['sans tâche (pas de priorité du moment), aucun anneau', cible(parc({}), ordreCfg(T, ORD), '') === null]);

  // Tâches à passages : tout se lit à l'ÉTAPE EN COURS
  const pas = etat => {
    const w = bac(S, Object.assign({ PARCELLES: [
      P('A', { [T]: { p1: 'Validé', p2: 'Non démarré' } }),
      P('B', { [T]: { p1: 'Validé', p2: 'Commencé' } }),
      P('C', { [T]: {} }) ], CONFIG: ordreCfg(T, ['A', 'B', 'C']), JOURNAL: [] },
      { __types: { [T]: 'passages' }, __etape: etat, __plan: 2 }));
    const c = w._mvCibleCarte(T);
    return c ? c.etat + ':' + c.ps.map(p => p.nom).join(',') : null;
  };
  R.push(['passages, étape P1 : A et B sont finies pour ce passage → la prochaine est C', pas(1) === 'prochaine:C']);
  R.push(['passages, étape P2 : B est commencée → c\'est elle', pas(2) === 'commencee:B']);
  R.push(['passages : une étape au-delà du plan de la parcelle compte comme finie', (() => {
    const w = bac(S, Object.assign({ PARCELLES: [P('A', { [T]: { ov: 1, p1: 'Validé' } }), P('B', { [T]: {} })],
      CONFIG: ordreCfg(T, ['A', 'B']), JOURNAL: [] }, { __types: { [T]: 'passages' }, __etape: 2, __plan: 2 }));
    const c = w._mvCibleCarte(T);
    return c && c.etat === 'prochaine' && c.ps[0].nom === 'B';
  })()]);
  R.push(['la priorité du moment est celle de l\'écran Vigne', (() => {
    const w = bac(S, { PARCELLES: [], _prioDefaultTask: () => 'Relevage' });
    const v = bac(S, { PARCELLES: [] });
    return w._mvTachePrio() === 'Relevage' && v._mvTachePrio() === '';
  })()]);

  // Le départ de la tournée : « dernière validée »
  const H = (h, m = 0) => Date.UTC(2026, 8, 18, h, m).toString(16);
  const V = (nom, id, date = '2026-09-18', tache = 'Relevage', statut = 'Validé') => ({ id, date, parcelle: nom, tache, statut });
  const pile = (...e) => e.slice().reverse();
  const dern = (journal, taches, garde) => {
    const w = bac(S, { PARCELLES: [P('A'), P('B'), P('C'), P('D')], JOURNAL: journal, CONFIG: {} });
    const d = w._mvDerniereValidee(taches, garde);
    return d ? d.nom : null;
  };
  R.push(['départ, même jour : A 8 h, B 10 h, C 15 h → C (le défaut d\'origine rendait A)',
    dern(pile(V('A', H(8)), V('B', H(10)), V('C', H(15))), ['Relevage']) === 'C']);
  R.push(['départ : la date du travail passe avant l\'heure de saisie',
    dern(pile(V('B', H(9)), V('C', H(10)), V('D', H(16), '2026-09-17')), null) === 'C']);
  R.push(['départ : une validation annulée ensuite ne compte plus',
    dern(pile(V('B', H(10)), V('C', H(15)), V('C', H(15, 5), '2026-09-18', 'Relevage', 'Annulé')), null) === 'B']);
  R.push(['départ : un `id` « -qv » (validation depuis la carte) se lit comme une heure',
    dern(pile(V('B', H(15)), V('A', H(16) + '-qv')), null) === 'A']);
  R.push(['départ : la garde écarte une parcelle sans position',
    dern(pile(V('A', H(8)), V('B', H(10))), null, p => p.nom !== 'B') === 'A']);
  return R;
}

/* ── B. Les appelants ────────────────────────────────────────────────────── */
function appelants(S) {
  const R = [];
  const pilNu = nu(S.pil);
  R.push(['pilotage : plus AUCUNE copie privée de « dernière faite » (les deux sont parties)',
    /_mvDerniereValidee\(/.test(corps(S.pil, '_opDern')) &&
    /_mvDerniereValidee\(/.test(corps(S.pil, '_dzDernierFait')) &&
    !/bestD/.test(pilNu) && !/dd\s*>=\s*bd/.test(pilNu)]);
  const cib = corps(S.pil, '_opCibles');
  R.push(['tournée : commencée sur un travail coché, sinon la première rangée placée',
    /_mvTacheEtat\(/.test(cib) && /_mvVueActive\(/.test(cib) && /_PIL_OP&&_PIL_OP\.tasks/.test(cib)]);
  R.push(['la carte de la tournée (page et plein écran) pose les anneaux de `_opCibles`',
    /_opCibles\(rows\)/.test(corps(S.pil, '_dzLayers')) && /_mvCibleAnneau\(/.test(corps(S.pil, '_dzLayers'))]);
  R.push(['le repli hors ligne aussi, et il garde les anneaux dans le cadre',
    /_opCibles\(seqRows\)/.test(corps(S.pil, '_opMapSvg')) && /mv-cible-svg/.test(corps(S.pil, '_opMapSvg'))]);
  const dom = corps(S.pil, '_pilBuildMap');
  R.push(['carte du domaine : la cible de la priorité du moment',
    /_mvCibleCarte\(window\._mvTachePrio\(\)\)/.test(dom) && /if\(_cib\)\s*_cib\.ps\.forEach\(/.test(dom)
      && /_mvCibleAnneau\(/.test(dom)]);
  const pd = corps(S.app, '_pCibleMapSync');
  R.push(['carte Parcelles : anciens anneaux retirés, tâche affichée sinon priorité, plusieurs anneaux',
    /removeLayer/.test(pd) && /pTacheFilter/.test(pd) && /_mvTachePrio\(\)/.test(pd)
      && /_mvCibleCarte\(/.test(pd) && /c\.ps\.forEach/.test(pd)]);
  const trois = ['initMap', 'refreshMapColors', 'renderParcelles'].filter(f => /_pCibleMapSync\(\)/.test(corps(S.app, f)));
  R.push(['carte Parcelles resynchronisée aux trois moments (création, couleurs, rendu) : ' + trois.length + '/3',
    trois.length === 3]);
  R.push(['l\'écran Vigne lit le MÊME état que les cartes (`_pvCurDone`, `_pvCurStarted`)',
    /_mvTacheEtat\(/.test(corps(S.app, '_pvCurDone')) && /_mvTacheEtat\(/.test(corps(S.app, '_pvCurStarted'))
      && /pCurStep/.test(corps(S.app, '_pvEtapeCourante'))]);
  R.push(['la tournée et les anneaux posent la même question de période',
    /window\._mvVueActive\(\)/.test(corps(S.app, '_pOrdPeriodeOK'))]);
  R.push(['l\'anneau n\'est pas cliquable et passe sous les autres repères',
    /interactive:\s*false/.test(S.defAnneau) && /zIndexOffset:\s*-\d+/.test(S.defAnneau)
      && /className:\s*'mv-cible'/.test(S.defAnneau)]);
  const C = S.css.replace(/\/\*[\s\S]*?\*\//g, '');
  const reduit = (C.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[^{}]*\.mv-cible-o[^{}]*\{[^}]*\}/g) || [])
    .some(b => /animation:\s*none/.test(b));
  R.push(['la feuille anime l\'anneau (`mvCible`) et le FIGE en mouvement réduit',
    /\.mv-cible-o\{[^}]*animation:\s*mvCible/.test(C) && /@keyframes mvCible\{/.test(C) && reduit
      && /\.mv-cible\{[^}]*pointer-events:\s*none/.test(C)]);
  return R;
}

function mesurer(src) {
  const S = {
    utils: src.utils, app: src.app, pil: src.pil, css: src.css,
    defEtat:  defWindow(src.utils, '_mvTacheEtat'),
    defPrio:  defWindow(src.utils, '_mvTachePrio'),
    defCible: defWindow(src.utils, '_mvCibleCarte'),
    defVue:   defWindow(src.utils, '_mvVueActive'),
    defDern:  defWindow(src.utils, '_mvDerniereValidee'),
    defOrdreMap: defWindow(src.utils, '_mvOrdreMap'),
    defOrdreFor: defWindow(src.utils, '_mvOrdreFor'),
    defAnneau: defWindow(src.utils, '_mvCibleAnneau'),
  };
  const manque = Object.keys(S).filter(k => k.startsWith('def') && !S[k]);
  const R = [['les sept définitions se lisent dans utils.js', !manque.length]];
  if (manque.length) return R;
  let sc;
  try { sc = scenarios(S); } catch (e) { sc = [['les scénarios s\'exécutent (' + e.message + ')', false]]; }
  return R.concat(sc, appelants(S));
}

/* ── Référence ───────────────────────────────────────────────────────────── */
let ok = 0, ko = 0;
console.log('\n── CE QUE LES CARTES MONTRENT — lot CIBLE-1\n');
for (const [nom, cond] of mesurer(BASE)) {
  if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); }
  else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); }
}
console.log('\n  ' + ok + ' vertes, ' + ko + ' rouges\n');
if (!CONTRE) process.exit(ko ? 1 : 0);
if (ko) { console.log('  contre-épreuve non jouée : la référence est rouge'); process.exit(1); }

/* ── Contre-épreuves ─────────────────────────────────────────────────────── */
const DEFAUTS = [
  { nom: 'la prochaine passe devant la parcelle commencée', f: 'utils',
    de: "  if(comm.length) return { etat: 'commencee', ps: comm, tache: T };\n", vers: '' },
  { nom: 'une seule parcelle commencée est montrée', f: 'utils',
    de: "ps: comm, tache: T };", vers: 'ps: comm.slice(0, 1), tache: T };' },
  { nom: 'la prochaine ne saute pas les parcelles finies', f: 'utils',
    de: "if(p && window._mvTacheEtat(p, T) !== 'finie')", vers: 'if(p)' },
  { nom: 'l\'ordre de la tournée est ignoré (première parcelle venue)', f: 'utils',
    de: '  var o = (typeof window._mvOrdreFor === \'function\') ? window._mvOrdreFor(T) : null;\n  if(!o) return null;\n',
    vers: '  var o = { ordre: act.map(function(p){ return p.nom; }) };\n' },
  { nom: 'une parcelle arrachée redevient une cible', f: 'utils',
    de: "p.statut !== 'Arrachee' &&", vers: '' },
  { nom: 'l\'étape en cours n\'est plus lue (tâche à passages)', f: 'utils',
    de: "  var i   = f('_pvEtapeCourante') ? window._pvEtapeCourante(T) : 1;", vers: '  var i   = 1;' },
  { nom: 'une étape au-delà du plan n\'est plus tenue pour finie', f: 'utils',
    de: "  if(i > eff) return 'finie';", vers: "  if(false) return 'finie';" },
  { nom: 'une archive consultée affiche quand même les anneaux', f: 'utils',
    de: "return (typeof window._visuSaison !== 'function') || window._visuSaison() === a;", vers: 'return true;' },
  { nom: 'le départ se départage par l\'ordre du tableau (le défaut d\'origine)', f: 'utils',
    de: ' || (b.t - a.t) || (a.i - b.i)', vers: ' || (b.i - a.i)' },
  { nom: 'le départ ignore les annulations', f: 'utils', de: '    if(annulee(v)) continue;\n', vers: '' },
  { nom: 'la copie privée de DZ-1 revient dans « Qui fait quoi »', f: 'pil',
    de: 'function _dzDernierFait(t){ var d=window._mvDerniereValidee([t], _opGeoOK); return d?d.p:null; }',
    vers: "function _dzDernierFait(t){ var best=null, bd=''; (window.JOURNAL||[]).forEach(function(j){ if(j&&j.tache===t&&j.statut==='Validé'&&j.parcelle){ var p=_opParcByNom(j.parcelle); if(p&&_opGeoOK(p)){ var dd=String(j.date||''); if(dd>=bd){ bd=dd; best=p; } } } }); return best; }" },
  { nom: 'l\'écran Vigne relit l\'état à sa façon', f: 'app',
    de: "function _pvCurStarted(p,nom){ return window._mvTacheEtat(p,nom||pTacheFilter)==='commencee'; }",
    vers: "function _pvCurStarted(p,nom){ nom=nom||pTacheFilter; return ((_tachesFor(p)[nom])||'')==='En cours'; }" },
  { nom: 'la carte Parcelles ne se resynchronise plus au rendu de la liste', f: 'app',
    de: '  _pOrdMapSync();\n  _pCibleMapSync();\n}\n\n', vers: '  _pOrdMapSync();\n}\n\n' },
  { nom: 'la carte du domaine perd ses anneaux', f: 'pil',
    de: '    if(_cib) _cib.ps.forEach(', vers: '    if(false) _cib.ps.forEach(' },
  { nom: 'l\'anneau devient cliquable', f: 'utils', de: 'interactive: false', vers: 'interactive: true' },
  { nom: 'le mouvement réduit n\'arrête plus l\'anneau', f: 'css',
    de: '@media(prefers-reduced-motion:reduce){.mv-cible-o,.mv-cible-svg{animation:none;',
    vers: '@media(prefers-reduced-motion:reduce){.mv-cible-o,.mv-cible-svg{' },
];
let det = 0; const rates = [];
for (const d of DEFAUTS) {
  const n = BASE[d.f].split(d.de).length - 1;
  if (n !== 1) { console.log('  \x1b[31m✗\x1b[0m injection NON POSÉE (' + n + ' ancre(s)) : ' + d.nom); rates.push(d.nom); continue; }
  const src = Object.assign({}, BASE, { [d.f]: BASE[d.f].replace(d.de, d.vers) });
  const rouges = mesurer(src).filter(r => !r[1]).length;
  if (rouges) { det++; console.log('    DÉTECTÉ  ' + d.nom + ' (' + rouges + ' rouge' + (rouges > 1 ? 's' : '') + ')'); }
  else { rates.push(d.nom); console.log('  \x1b[31m✗\x1b[0m NON DÉTECTÉ  ' + d.nom); }
}
console.log('');
if (rates.length) { console.log('  \x1b[31m' + rates.length + ' défaut(s) passent inaperçus\x1b[0m\n'); process.exit(1); }
console.log('  Les ' + det + ' défauts sont détectés.\n');
process.exit(0);
