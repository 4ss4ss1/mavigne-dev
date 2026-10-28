/* ───────────────────────────────────────────────────────
   HARNAIS — FILTRE-1A (§476) : LE JOURNAL AU TÉLÉPHONE, LA LISTE D'ABORD (docs/maquettes/maquette-ux-v1.html, partie 2)
   Lancer :          node scripts/mv-harnais-filtre1a.mjs
   Contre-épreuves : node scripts/mv-harnais-filtre1a.mjs --contre

   POURQUOI IL EXISTE
   Quatre rangées de filtres passaient avant la première entrée. Ce lot les range dans une feuille du bas ; la recherche et
   « Filtrer · n » vivent dans une barre basse ; seuls les filtres actifs restent, en chips ; l'ajout devient un bouton flottant.
   Ce harnais garde la STRUCTURE (lue dans index.html : les quatre rangées dans la feuille), et JOUE _jFeuilleMaj et _jRetire
   (extraites d'app.js) : le compte de « Filtrer » (sans la recherche, qui a sa place), « Voir N entrées », les chips, le retrait
   d'un filtre (les dates vidées dans leurs champs), le bouton flottant caché quand « + Ajouter » l'est.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { html: lire('index.html'), app: lire('src/app.js'), css: lire('src/styles.css'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function finBloc(s, i) { const re = /<(\/?)div\b[^>]*>/g; re.lastIndex = i; let d = 0, m; while ((m = re.exec(s))) { d += m[1] ? -1 : 1; if (!d) return re.lastIndex; } return -1; }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, etat) {
  const els = {}; const el = (id) => (els[id] = els[id] || { id, textContent: '', innerHTML: '', value: 'x', hidden: false, style: { display: '' } });
  ['j-filtrer-n', 'j-feuille-voir', 'j-fab', 'journal-add-btn', 'j-actifs', 'jDateDeb', 'jDateFin', 'jDateClear', 'jSearch', 'jSearch-clear'].forEach(el);
  let rendus = 0;
  const ctx = Object.assign({ _jPage: 3, document: { getElementById: (id) => els[id] || null, body: { classList: { toggle: () => {} } } }, tNom: (x) => x, _escAttr: (x) => String(x), _escHtml: (x) => String(x).replace(/</g, '&lt;'), renderJournalList: () => { rendus++; } }, etat);
  vm.createContext(ctx); vm.runInContext(fonction(S.app, 'function _jFeuilleMaj(') + '\n' + fonction(S.app, 'function _jRetire(') + '\nthis.maj = _jFeuilleMaj; this.retire = _jRetire;', ctx);
  return { ctx, els, rendus: () => rendus, maj: (n) => ctx.maj(n), retire: (k) => ctx.retire(k) };
}
function jouer(S) {
  const i = S.html.indexOf('<div class="j-feuille" id="j-feuille"'), f = i >= 0 ? finBloc(S.html, i) : -1, feuille = f > 0 ? S.html.slice(i, f) : '';
  t('① la feuille porte les quatre rangées — Qui, Tâche, Quand, Parcelle — et « Voir … »', ['id="ouvrier-chips-row"', 'id="tache-chips-row"', 'class="j-date-range"', 'id="j-parcelle-filter-row"', 'id="j-feuille-voir"'].every((x) => feuille.includes(x))
    && ['Qui', 'Tâche', 'Quand', 'Parcelle'].every((l) => feuille.includes('<div class="j-feuille-lbl">' + l + '</div>')) && !feuille.includes('id="jSearch"'));
  t('① la barre basse : la recherche et « Filtrer » ; les chips actifs ; le bouton flottant ouvre l’ajout', /<div class="j-barre" id="j-barre"><div class="sbox">[\s\S]*?id="jSearch"[\s\S]*?<button type="button" class="j-filtrer" id="j-filtrer" onclick="_jFeuille\(true\)">/.test(S.html)
    && S.html.includes('<div class="j-actifs" id="j-actifs"></div>') && S.html.includes('<button type="button" class="j-fab" id="j-fab" onclick="openJournalEntry()"'));
  const A = monde(S, { jQui: 'Marie', jTache: 'Palissage', jParcelle: 'toutes', jDateDeb: '2026-10-01', jDateFin: '', jSearch: 'murg' }); A.maj(4);
  t('② « Filtrer » compte les filtres de la feuille (3 : qui, tâche, dates — pas la recherche, qui a sa place)', A.els['j-filtrer-n'].textContent === '3');
  t('② « Voir 4 entrées » ; les chips : la tâche, la personne, les dates, la recherche', A.els['j-feuille-voir'].textContent === 'Voir 4 entrées' && (A.els['j-actifs'].innerHTML.match(/class="tfchip active j-actif"/g) || []).length === 4 && A.els['j-actifs'].innerHTML.includes('_jRetire(\'dates\')'));
  A.retire('dates');
  t('③ retirer « Dates » vide les deux champs et relance la liste, page 0', A.ctx.jDateDeb === '' && A.ctx.jDateFin === '' && A.els.jDateDeb.value === '' && A.els.jDateFin.value === '' && A.ctx._jPage === 0 && A.rendus() === 1);
  const B = monde(S, { jQui: 'tous', jTache: 'toutes', jParcelle: 'toutes', jDateDeb: '', jDateFin: '', jSearch: '' }); B.els['journal-add-btn'].style.display = 'none'; B.maj(1);
  t('④ sans filtre : « Filtrer » sans nombre, aucune chip ; « Voir 1 entrée » ; le bouton flottant caché quand « + Ajouter » l’est', B.els['j-filtrer-n'].textContent === '' && B.els['j-actifs'].innerHTML === '' && B.els['j-feuille-voir'].textContent === 'Voir 1 entrée' && B.els['j-fab'].hidden === true);
  t('⑤ au téléphone : la feuille cachée puis ouverte, la barre et le bouton flottant posés, « + Ajouter » de l’en-tête caché ; sur ordinateur, les pièces du téléphone cachées',
    S.css.includes('body.j-feuille-ouverte #page-journal .j-feuille{display:block;}') && S.css.includes('#page-journal .j-barre{position:fixed;') && S.css.includes('#page-journal #journal-add-btn,#page-journal .j-filtres-pill{display:none!important;}')
    && S.css.includes('.j-feuille-tete,.j-feuille-lbl,.j-feuille-voir,.j-voile,.j-filtrer,.j-actifs,.j-fab{display:none;}'));
  t('⑥ les fonctions des chips et de la feuille sont exposées', S.app.includes('window._jFeuille = _jFeuille; window._jRetire = _jRetire;'));
  t('⑦ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-filtre1a.mjs'") > 0 && S.liste.indexOf("mv-harnais-filtre1a.mjs --contre'") > 0);
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
    ['« Filtrer » compte aussi la recherche', m('app', "+((jDateDeb||jDateFin)?1:0);", "+((jDateDeb||jDateFin)?1:0)+(jSearch?1:0);")],
    ['« Voir » ne dit plus le compte', m('app', "v.textContent='Voir '+tot+' entr", "v.textContent='Voir les entr'+'")],
    ['retirer les dates laisse les champs remplis', m('app', "if(dd)dd.value=''; if(df)df.value='';", '')],
    ['le bouton flottant ignore « + Ajouter » caché', m('app', "if(f&&b) f.hidden=(b.style.display==='none');", '')],
    ['la recherche entre dans la feuille', (S) => Object.assign({}, S, { html: S.html.replace('<div class="j-feuille-lbl">Quand</div>', '<div class="j-feuille-lbl">Quand</div><input id="jSearch">') })],
    ['la feuille ne s’ouvre plus', m('css', 'body.j-feuille-ouverte #page-journal .j-feuille{display:block;}', '')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-filtre1a.mjs'").join("mv-harnais-filtreZ.mjs'") })],
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
