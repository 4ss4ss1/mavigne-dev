/* ───────────────────────────────────────────────────────
   HARNAIS — TRAC-UX-1B (§481) : LE TRACTEUR SUR ORDINATEUR — LE PARC ET LE GNR À DROITE (docs/maquettes/maquette-ux-v2.html, Tracteur)
   Lancer :          node scripts/mv-harnais-traux1b.mjs
   Contre-épreuves : node scripts/mv-harnais-traux1b.mjs --contre

   POURQUOI IL EXISTE
   Décision de Nico (28/10) : sur ordinateur, la colonne de droite porte le parc et le GNR, comme la maquette ; la fiche de
   session s'ouvre en feuille. Ce harnais JOUE _trParcEtat et _trDroiteHtml (extraites de tracteur.js) : le parc rangé par
   urgence (au garage, révision dépassée, proche, le reste — l'ordre du parc à égalité), « révision dépassée de 18 h » au lieu
   d'un « dans −18 h », la cuve et son seuil, les heures du mois ; il garde la grille, l'Entretien sans colonne, le clic.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { html: lire('index.html'), tr: lire('src/tracteur.js'), css: lire('src/styles.css'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, o) {
  const ctx = { TRACTEURS_LIST: o.parc, REPARATEUR: o.rep || {}, SESSIONS: o.sess || [], _fmtDate: (d) => d, _gnrNum: (n) => String(n), _escHtml: (x) => String(x), _escAttr: (x) => String(x),
    _mvBadge: (l, c) => '<span class="mvpas ' + c + '">' + l + '</span>', _gnrTodayISO: () => '2026-10-28', _trMinutes: (s) => ({ total: s.min || 0 }), _trHeuresFr: (h) => h + ' h', window: { CONFIG: { gnr: o.gnr || null } } };
  vm.createContext(ctx); vm.runInContext(fonction(S.tr, 'function _trParcEtat(') + '\n' + fonction(S.tr, 'function _trDroiteHtml(') + '\nthis.etat=_trParcEtat; this.droite=_trDroiteHtml;', ctx);
  return ctx;
}
function jouer(S) {
  const parc = [{ id: 'a', nom: 'Enjambeur', compteur_h: 412, revision_h: 900 }, { id: 'b', nom: 'Fendt', compteur_h: 2031, revision_h: 2013 }, { id: 'c', nom: 'New Holland', compteur_h: 1248, revision_h: 1300 }, { id: 'd', nom: 'Kubota' }];
  const A = monde(S, { parc, rep: { d: { prevu_retour: '2026-11-02' } }, gnr: { capacite: 1500, niveau: 240, seuil: 300, maj: '2026-10-18' }, sess: [{ date: '2026-10-21', min: 860 }, { date: '2026-09-30', min: 120 }, { date: '2026-10-22', type: 'traitement', min: 99 }] });
  const h = A.droite(); const ordre = ['Kubota', 'Fendt', 'New Holland', 'Enjambeur'].map((n) => h.indexOf('<span class="trd-n">' + n + '</span>'));
  t('① le parc par urgence : au garage, révision dépassée, toute proche (≤ 50 h), le reste', ordre.every((x, i) => x > 0 && (i === 0 || x > ordre[i - 1])));
  t('① « révision dépassée de 18 h » (pas « dans −18 h ») ; « au garage · retour 2026-11-02 »', h.includes('2031 h · révision dépassée de 18 h') && h.includes('au garage · retour 2026-11-02') && !h.includes('dans -'));
  t('① un tracteur ouvre son entretien (la valeur lue dans data-tid)', h.includes('data-tid="b" onclick="switchTracOnglet(\'entretiens\');selectTracteur(this.dataset.tid)"'));
  t('② la cuve : 240 / 1500 L, relevée le 2026-10-18, sous le seuil ; les heures du mois sans les traitements ni le mois d’avant', h.includes('240 / 1500 L · relevé le 2026-10-18') && h.includes('Sous le seuil') && h.includes('14.333333333333334 h de moteur'));
  const B = monde(S, { parc: [] }); const hb = B.droite();
  t('② sans parc ni cuve : on le dit, rien d’inventé', hb.includes('Aucun tracteur au parc.') && hb.includes('Cuve non renseignée'));
  t('③ sur ordinateur, la grille : à gauche le reste, à droite la colonne collante ; la fiche et les pastilles cachées ; l’Entretien sans colonne',
    S.css.includes('#page-tracteur.active{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,360px);grid-auto-flow:row dense;') && S.css.includes('#page-tracteur.active > #trac-droite{display:block;grid-column:2;grid-row:span 20;position:sticky;')
    && S.css.includes('#page-tracteur #trac-parc-pills,#page-tracteur #trac-panel-sessions > #trac-fiche{display:none!important;}') && S.css.includes('#page-tracteur.trac-ent-on > #trac-droite{display:none!important;}'));
  t('③ la colonne se remplit à chaque rendu ; une session s’ouvre en feuille partout ; l’onglet Entretien marqué', S.tr.includes("if(_dr) _dr.innerHTML=_trDroiteHtml();") && S.tr.includes("const clk=canOpen?`onclick=\"openSessionDetail('${s.id}')\"") && S.tr.includes("_pgT.classList.toggle('trac-ent-on',_tracOnglet==='entretiens');")
    && S.html.includes('<aside class="trac-droite" id="trac-droite" aria-label="Le parc et le GNR"></aside>'));
  t('④ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-traux1b.mjs'") > 0 && S.liste.indexOf("mv-harnais-traux1b.mjs --contre'") > 0);
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
    ['le parc n’est plus rangé par urgence', m('tr', '.sort(function(a,b){ return (a.e.rang-b.e.rang)||(a.i-b.i); });', ';')],
    ['une révision dépassée se dit « dans −18 h »', m('tr', "  if(reste<0) return { rang:1, txt:_gnrNum(comp)+' h \\u00b7 r\\u00e9vision d\\u00e9pass\\u00e9e de '+_gnrNum(-reste)+' h', badge:_mvBadge('Entretien','rouge') };\n", '')],
    ['les heures du mois comptent les traitements', m('tr', "return s.type!=='traitement'&&String(s.date||'').slice(0,7)===mois;", "return String(s.date||'').slice(0,7)===mois;")],
    ['l’Entretien garde la colonne de droite', m('css', '#page-tracteur.trac-ent-on > #trac-droite{display:none!important;}', '')],
    ['la colonne ne se remplit plus', m('tr', "if(_dr) _dr.innerHTML=_trDroiteHtml();", '')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-traux1b.mjs'").join("mv-harnais-trauxZ.mjs'") })],
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
