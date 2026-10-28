/* ───────────────────────────────────────────────────────
   HARNAIS — FILTRE-1B (§477) : PARCELLES AU TÉLÉPHONE, LA LISTE D'ABORD (docs/maquettes/maquette-ux-v1.html, partie 2)
   Lancer :          node scripts/mv-harnais-filtre1b.mjs
   Contre-épreuves : node scripts/mv-harnais-filtre1b.mjs --contre

   POURQUOI IL EXISTE
   La maquette : « Sur Parcelles, les compteurs restent en tête ; les chips de tâche et Liste / Carte passent dans la même
   feuille. » La feuille existait pour l'ouvrier sur sa priorité (ARRIVEE-4, §355) ; elle sert maintenant tout le monde au
   téléphone. Ce harnais JOUE _pFxRender et _pFxBadge (extraites d'app.js) : la feuille porte l'état, la tâche (la rangée du
   haut recopiée), Liste / Carte et l'ordre ; la pastille compte une tâche choisie — sauf chez l'ouvrier sur sa priorité ;
   et il garde la règle CSS (rangées cachées, barre basse, Liste / Carte revenu en haut sur la carte).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { app: lire('src/app.js'), css: lire('src/styles.css'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, o) {
  const cls = (on) => ({ contains: (x) => on.includes(x) });
  const els = { 'p-fx-corps': { innerHTML: '' }, 'p-tache-filter-row': { innerHTML: o.taches }, tbc: { classList: cls(o.carte ? ['active'] : []) }, 'p-fx-badge': { textContent: '', hidden: true }, 'page-parcelles': { classList: cls(o.arrivee ? ['p-arrivee'] : []) }, ovPFiltres: { classList: cls([]) } };
  const ctx = { pFilter: 'toutes', pTacheFilter: o.tache, _pProxPos: null, window: { pShowDone: false }, _escHtml: (x) => String(x), _escAttr: (x) => String(x), _pProxBloque: () => false, setTimeout() {},
    document: { getElementById: (id) => els[id] || null, querySelectorAll: () => ({ length: 7 }) } };
  vm.createContext(ctx); vm.runInContext(['function _pFxEtat(', 'function _pFxActifs(', 'function _pFxRender(', 'function _pFxBadge('].map((d) => fonction(S.app, d)).join('\n') + '\nthis.rendre = _pFxRender; this.badge = _pFxBadge;', ctx);
  return { ctx, els };
}
function jouer(S) {
  const A = monde(S, { taches: '<div class="ptfchip active" data-t="toutes" onclick="setPTacheFilter(\'toutes\',this)">Toutes tâches</div><div class="ptfchip" onclick="setPTacheFilter(\'Taille\',this)">Taille</div>', carte: false, tache: 'toutes' });
  A.ctx.rendre(); const h = A.els['p-fx-corps'].innerHTML;
  t('① la feuille porte l’état, la tâche (la rangée du haut recopiée, ses gestes avec), Liste / Carte, l’ordre et « Voir 7 parcelles »', h.includes('<div class="p-fx-k">Afficher</div>') && h.includes('<div class="p-fx-k">Tâche</div><div class="p-fx-chips p-fx-taches">') && h.includes("setPTacheFilter('Taille',this)")
    && h.includes('<div class="p-fx-k">Affichage</div>') && h.includes('data-v="liste" onclick="_pFxVue(this.dataset.v)"') && h.includes('<div class="p-fx-k">Ordre</div>') && h.includes('Voir 7 parcelles'));
  t('① Liste active quand la carte ne l’est pas', /class="p-fx-chip on" data-v="liste"/.test(h) && /class="p-fx-chip" data-v="carte"/.test(h));
  const B = monde(S, { taches: '', carte: true, tache: 'toutes' }); B.ctx.rendre();
  t('① sans rangée de tâches, pas de section vide ; sur la carte, « Carte » active', !B.els['p-fx-corps'].innerHTML.includes('>Tâche<') && /class="p-fx-chip on" data-v="carte"/.test(B.els['p-fx-corps'].innerHTML));
  const C = monde(S, { taches: 'x', carte: false, tache: 'Taille' }); C.ctx.badge();
  t('② une tâche choisie compte dans la pastille « Filtres »', C.els['p-fx-badge'].textContent === '1' && C.els['p-fx-badge'].hidden === false);
  const D = monde(S, { taches: 'x', carte: false, tache: 'Taille', arrivee: true }); D.ctx.badge();
  t('② chez l’ouvrier sur sa priorité, la tâche de l’admin ne compte pas', D.els['p-fx-badge'].hidden === true);
  t('③ au téléphone : l’état, les tâches et Liste / Carte cachés en haut ; Liste / Carte revient sur la carte ; la barre basse ; « Filtres » pour tous',
    S.css.includes('#page-parcelles .frow,#page-parcelles .tabs2,#page-parcelles #p-tache-filter-row{display:none!important;}') && S.css.includes('#page-parcelles.p-vue-carte .tabs2{display:flex!important;}')
    && S.css.includes('#page-parcelles .p-srow{position:fixed;') && S.css.includes('#page-parcelles .p-fx-btn{display:inline-flex;'));
  t('③ switchPTab marque la vue carte ; _pFxVue ferme la feuille sur la vue choisie, exposée', S.app.includes("if(_pg) _pg.classList.toggle('p-vue-carte',tab==='carte');") && S.app.includes("function _pFxVue(v){ switchPTab(v==='carte'?'carte':'liste'); if(typeof closeOv==='function') closeOv(null,'ovPFiltres'); }") && S.app.includes('window._pFxVue = _pFxVue;'));
  t('④ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-filtre1b.mjs'") > 0 && S.liste.indexOf("mv-harnais-filtre1b.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].replace(a, b) }); };
  const mutants = [
    ['la feuille perd la tâche', m('app', "if(tr&&String(tr.innerHTML||'').trim()) h+=", "if(false) h+=")],
    ['la feuille perd Liste / Carte', m('app', "h+='<div class=\"p-fx-k\">Affichage</div>", "h+='<div class=\"p-fx-k\">Rien</div>")],
    ['la tâche ne compte plus dans la pastille', m('app', "if(pTacheFilter!=='toutes'&&!(pg&&pg.classList.contains('p-arrivee'))) n++;", '')],
    ['la tâche de l’admin compte chez l’ouvrier', m('app', "if(pTacheFilter!=='toutes'&&!(pg&&pg.classList.contains('p-arrivee'))) n++;", "if(pTacheFilter!=='toutes') n++;")],
    ['sur la carte, plus de retour à la liste', m('css', '#page-parcelles.p-vue-carte .tabs2{display:flex!important;}', '')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-filtre1b.mjs'").join("mv-harnais-filtreZ.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m mutant impossible (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
