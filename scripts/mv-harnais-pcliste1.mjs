/* ───────────────────────────────────────────────────────
   HARNAIS — PC-LISTE-1 (§478) : LE JOURNAL SUR ORDINATEUR EN LISTE ET FICHE (docs/maquettes/maquette-ux-v1.html, partie 5)
   Lancer :          node scripts/mv-harnais-pcliste1.mjs
   Contre-épreuves : node scripts/mv-harnais-pcliste1.mjs --contre

   POURQUOI IL EXISTE
   Sur grand écran, le Journal montrait quatre entrées par écran. Ce lot le pose en trois colonnes — les filtres, la liste dense,
   la fiche de l'entrée choisie — avec le clavier. Ce harnais JOUE _jFicheHtml, _jMontre, _jSel et _jFicheSync (extraites
   d'app.js) : la fiche dit l'entrée (date et heure, tâche, parcelle, surface, qui, l'équipe), la sélection suit la liste (la
   première si la choisie a disparu), un appui au téléphone ne fait rien de neuf ; il garde l'entrée cliquable (data-jid par
   _escAttr, sans valeur dans le gestionnaire), la grille de l'ordinateur et les touches J / K / N / « / ».
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
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, desk, ids) {
  const fiche = { innerHTML: '' }; const rows = ids.map((id) => ({ dataset: { jid: id }, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }));
  const ctx = { _jSelId: '', JOURNAL: [{ id: 1, date: '2026-10-24', time: '11:05', tache: 'Palissage', parcelle: 'La Combotte', statut: 'Validé', equipe: true, qui: 'Jean', membresEquipe: ['Marie'] }, { id: 2, date: '2026-10-23', tache: 'Taille', parcelle: 'Les Charmes', statut: 'En cours', qui: 'Paul' }],
    PARCELLES: [{ nom: 'La Combotte', surface: 0.61 }], window: { matchMedia: () => ({ matches: desk }) },
    document: { getElementById: (id) => (id === 'j-fiche' ? fiche : null), querySelectorAll: () => rows },
    fmtDate: (d) => d, tNom: (x) => x, _escHtml: (x) => String(x), _mvBadge: (s) => '<b class="badge">' + s + '</b>', _jFaitPar: () => [], _jEqTrace: () => '', _renderMeteoSnapshot: () => '', _jEqBtn: () => '<button class="eq">Équipe</button>' };
  vm.createContext(ctx); vm.runInContext(['function _jDesk(', 'function _jFicheHtml(', 'function _jRows(', 'function _jMontre(', 'function _jSel(', 'function _jFicheSync('].map((d) => fonction(S.app, d)).join('\n') + '\nthis.sel = _jSel; this.sync = _jFicheSync;', ctx);
  return { ctx, fiche, rows };
}
function jouer(S) {
  t('① l’entrée se choisit d’un appui : data-jid par _escAttr, le gestionnaire lit this.dataset (aucune valeur glissée)', S.app.includes('return `<div class="jitem" data-jid="${_escAttr(String(r.id==null?\'\':r.id))}" onclick="_jSel(this.dataset.jid)">'));
  const A = monde(S, true, ['1', '2']); A.ctx.sync();
  t('② la fiche suit la liste : la première entrée choisie d’office, marquée', /La Combotte/.test(A.fiche.innerHTML) && A.rows[0].attrs['aria-selected'] === 'true' && A.rows[1].attrs['aria-selected'] === 'false');
  t('② la fiche dit l’entrée : date et heure, tâche et parcelle, statut, surface, l’équipe, le bouton Équipe', A.fiche.innerHTML.includes('2026-10-24 · 11:05') && A.fiche.innerHTML.includes('Palissage · La Combotte') && A.fiche.innerHTML.includes('<b class="badge">Validé</b>')
    && A.fiche.innerHTML.includes('0,61 ha') && A.fiche.innerHTML.includes('Équipe Jean, Marie') && A.fiche.innerHTML.includes('<button class="eq">'));
  A.ctx.sel('2');
  t('② un appui en choisit une autre', /Les Charmes/.test(A.fiche.innerHTML) && A.rows[1].attrs['aria-selected'] === 'true');
  const B = monde(S, true, ['2']); B.ctx._jSelId = '1'; B.ctx.sync();
  t('② la choisie a disparu de la liste (un filtre) : la première prend sa place', /Les Charmes/.test(B.fiche.innerHTML));
  const C = monde(S, false, ['1', '2']); C.ctx.sel('2');
  t('③ au téléphone, un appui ne fait rien de neuf', C.fiche.innerHTML === '' && C.ctx._jSelId === '');
  t('④ les trois colonnes sur ordinateur (dense : les colonnes de côté au plus haut libre), la fiche collante, la liste en lignes',
    S.css.includes('#page-journal.active{display:grid;grid-template-columns:minmax(0,240px) minmax(0,1fr) minmax(0,360px);grid-auto-flow:row dense;') && S.css.includes('#page-journal.active > #j-fiche{display:block;grid-column:3;grid-row:span 20;position:sticky;')
    && S.css.includes('#page-journal.active > #j-feuille{grid-column:1;') && S.css.includes('#page-journal .jitem .jdotcol,'));
  t('④ la fiche et les touches posées après la liste', /<div class="timeline" id="timeline"><\/div>\n  <!-- ★ PC-LISTE-1 \(§478\)[^\n]*\n  <aside class="jfx" id="j-fiche"/.test(S.html) && S.html.includes('<div class="j-touches" id="j-touches"'));
  t('⑤ le clavier : J / K et les flèches, N (si « + Ajouter » se montre), « / » vers la recherche ; jamais dans un champ ni sous une fenêtre',
    S.app.includes("var bas=(k==='j'||k==='J'||k==='ArrowDown'), haut=(k==='k'||k==='K'||k==='ArrowUp');") && S.app.includes("if(b&&b.style.display!=='none'){ ev.preventDefault(); openJournalEntry(); }") && S.app.includes("if(k==='/'){ var s=document.getElementById('jSearch');")
    && S.app.includes("if(ev.target&&ev.target!==document.body) return;\n  if(document.querySelector('.overlay.open')) return;"));
  t('⑥ exposée ; la liste joue ce fichier et sa contre-épreuve', S.app.includes('window._jSel = _jSel;') && S.liste.indexOf("mv-harnais-pcliste1.mjs'") > 0 && S.liste.indexOf("mv-harnais-pcliste1.mjs --contre'") > 0);
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
    ['la choisie disparue n’est pas remplacée', m('app', "_jMontre(ids.indexOf(_jSelId)>=0?_jSelId:(ids[0]||''));", '_jMontre(_jSelId);')],
    ['au téléphone, l’appui choisit aussi', m('app', 'function _jSel(id){ if(!_jDesk()) return; _jMontre(id); }', 'function _jSel(id){ _jMontre(id); }')],
    ['la fiche perd la surface', m('app', "+(su?'<span>'+_escHtml(String(su).replace('.',','))+' ha</span>':'')", '')],
    ['la fiche perd l’équipe', m('app', ".concat(r.membresEquipe||[])", '')],
    ['la grille n’est plus dense (la fiche descend sous la liste)', m('css', 'grid-auto-flow:row dense;', '')],
    ['le clavier agit dans un champ', m('app', "if(ev.target&&ev.target!==document.body) return;\n  if(document.querySelector('.overlay.open')) return;", "if(document.querySelector('.overlay.open')) return;")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-pcliste1.mjs'").join("mv-harnais-pclisteZ.mjs'") })],
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
