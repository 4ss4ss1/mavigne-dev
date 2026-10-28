/* ───────────────────────────────────────────────────────
   HARNAIS — PC-LISTE-2 (§479) : LE CLAVIER DES LISTES AVEC FICHE — LE REGISTRE PHYTO ET LE CHAI
   Lancer :          node scripts/mv-harnais-pcliste2.mjs
   Contre-épreuves : node scripts/mv-harnais-pcliste2.mjs --contre

   POURQUOI IL EXISTE
   Le Registre et Le Chai avaient leur liste et leur fiche (PHYTO-1, CAVE-3), pas le clavier du Journal. Ce harnais JOUE
   _mvListeTouche (extraite d'app.js) sur des lignes posées : J et ↓ cliquent la ligne suivante, K et ↑ la précédente (la
   première si aucune n'est choisie), aux bornes on reste ; N clique « Saisir » s'il se montre ; rien au téléphone, rien dans un
   champ, rien sous une fenêtre ouverte, rien sur une autre page ou un autre onglet.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { app: lire('src/app.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function tableau(src) { const i = src.indexOf('var _MV_LISTES=['); if (i < 0) throw new Error('_MV_LISTES introuvable'); const j = src.indexOf('];', i); return src.slice(i, j + 2); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, o) {
  const clics = []; const rows = (o.n || 3) && Array.from({ length: o.n || 3 }, (_, i) => ({ i, sel: i === o.sel, getAttribute: function () { return this.sel ? 'true' : 'false'; }, click() { clics.push(this.i); }, scrollIntoView() {} }));
  const neuf = { offsetParent: o.neufVisible ? {} : null, click() { clics.push('N'); } };
  const pages = { 'page-phyto': { classList: { contains: (c) => (c === 'active' ? o.page === 'phyto' : c === 'ph-reg-on' ? o.registre !== false : false) } }, 'page-cave': { classList: { contains: (c) => c === 'active' && o.page === 'cave' } } };
  const ctx = { window: { matchMedia: () => ({ matches: o.desk !== false }) }, document: { body: {}, getElementById: (id) => (id === 'ph-new-btn' ? neuf : id === 'mvc-view-cuv' ? { offsetParent: o.chaiVisible ? {} : null } : pages[id] || null),
    querySelector: () => (o.fenetre ? {} : null), querySelectorAll: () => rows } };
  vm.createContext(ctx); vm.runInContext(tableau(S.app) + '\n' + fonction(S.app, 'function _mvListeTouche(') + '\nthis.f = _mvListeTouche;', ctx);
  const touche = (key, cible) => { let empeche = false; ctx.f({ key, target: cible || ctx.document.body, preventDefault() { empeche = true; } }); return empeche; };
  return { touche, clics };
}
function jouer(S) {
  const A = monde(S, { page: 'phyto', sel: 0 }); A.touche('j');
  t('① Registre : J clique la ligne suivante', A.clics.join() === '1');
  const B = monde(S, { page: 'phyto', sel: 2 }); B.touche('ArrowDown'); B.touche('k');
  t('① à la dernière, ↓ reste sur elle ; K remonte', B.clics.join() === '2,1');
  const C = monde(S, { page: 'phyto' }); C.touche('ArrowUp');
  t('① aucune ligne choisie : K prend la première', C.clics.join() === '0');
  const D = monde(S, { page: 'phyto', neufVisible: true }); D.touche('n'); const D2 = monde(S, { page: 'phyto', neufVisible: false }); D2.touche('N');
  t('② N clique « Saisir un traitement » s’il se montre, rien sinon', D.clics.join() === 'N' && D2.clics.length === 0);
  const E = monde(S, { page: 'cave', chaiVisible: true, sel: 0 }); E.touche('j'); const E2 = monde(S, { page: 'cave', chaiVisible: false, sel: 0 }); E2.touche('j');
  t('③ Le Chai : J passe à la cuvée suivante quand la vue est montrée ; rien sur un autre onglet de la Cave', E.clics.join() === '1' && E2.clics.length === 0);
  const F = monde(S, { page: 'phyto', registre: false, sel: 0 }); F.touche('j');
  t('③ Phyto hors du Registre (Catalogue, Fertilisation) : rien', F.clics.length === 0);
  const G = monde(S, { page: 'phyto', sel: 0, desk: false }); G.touche('j'); const H = monde(S, { page: 'phyto', sel: 0, fenetre: true }); H.touche('j'); const I = monde(S, { page: 'phyto', sel: 0 }); I.touche('j', { tag: 'input' });
  t('④ rien au téléphone, rien sous une fenêtre ouverte, rien dans un champ', G.clics.length === 0 && H.clics.length === 0 && I.clics.length === 0);
  t('⑤ l’écoute est posée ; la liste joue ce fichier et sa contre-épreuve', S.app.includes("document.addEventListener('keydown',_mvListeTouche);") && S.liste.indexOf("mv-harnais-pcliste2.mjs'") > 0 && S.liste.indexOf("mv-harnais-pcliste2.mjs --contre'") > 0);
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
    ['↓ dépasse la dernière ligne', m('app', 'var n=bas?Math.min(rows.length-1,i+1):Math.max(0,i<0?0:i-1);\n    ev.preventDefault(); rows[n].click();', 'var n=bas?i+1:Math.max(0,i<0?0:i-1);\n    ev.preventDefault(); if(rows[n]) rows[n].click();')],
    ['N clique même caché', m('app', 'if(b&&b.offsetParent!==null){ ev.preventDefault(); b.click(); }', 'if(b){ ev.preventDefault(); b.click(); }')],
    ['le Chai répond sur tous les onglets', m('app', "actif:function(){ var v=document.getElementById('mvc-view-cuv'); return !!(v&&v.offsetParent!==null); }", 'actif:function(){ return true; }')],
    ['le clavier agit dans un champ', m('app', "  if(ev.target&&ev.target!==document.body) return;\n  if(document.querySelector('.overlay.open')) return;\n  var k=ev.key, bas=", "  if(document.querySelector('.overlay.open')) return;\n  var k=ev.key, bas=")],
    ['le clavier répond au téléphone', m('app', "  if(!(window.matchMedia&&window.matchMedia('(min-width: 1024px)').matches)) return;\n  if(ev.target&&ev.target!==document.body) return;\n  if(document.querySelector('.overlay.open')) return;\n  var k=ev.key, bas=", "  if(ev.target&&ev.target!==document.body) return;\n  if(document.querySelector('.overlay.open')) return;\n  var k=ev.key, bas=")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-pcliste2.mjs'").join("mv-harnais-pclisteZ.mjs'") })],
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
