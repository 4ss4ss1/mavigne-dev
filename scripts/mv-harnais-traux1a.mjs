/* ───────────────────────────────────────────────────────
   HARNAIS — TRAC-UX-1A (§480) : LA SESSION EN COURS EN TÊTE, « TERMINER » AVEC ANNULER (docs/maquettes/maquette-ux-v2.html, Tracteur)
   Lancer :          node scripts/mv-harnais-traux1a.mjs
   Contre-épreuves : node scripts/mv-harnais-traux1a.mjs --contre

   POURQUOI IL EXISTE
   La session en cours arrivait à 462 px, après quatre compteurs (deux à zéro), le bandeau et deux rangées de pastilles. Ce
   harnais JOUE les vraies fonctions (extraites de tracteur.js) : la carte de la session en cours (ce qu'elle dit, ses deux
   boutons pour qui peut saisir, aucun pour les autres) ; « Terminer » (décision de Nico, 28/10 : la session se ferme
   aujourd'hui, les parcelles pas faites restent à faire) et son Annuler qui remet tout tel quel ; la recherche ; les compteurs
   sans zéros. Il garde la structure (la carte en tête, les pastilles dans la feuille, la barre basse) et la marge du « + ».
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
function finBloc(s, i) { const re = /<(\/?)div\b[^>]*>/g; re.lastIndex = i; let d = 0, m; while ((m = re.exec(s))) { d += m[1] ? -1 : 1; if (!d) return re.lastIndex; } return -1; }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, o) {
  const appels = { save: 0, rendu: 0 };
  const ctx = { PARCELLES: [{ nom: 'Aux Murgers', surface: '1.20' }, { nom: 'La Combotte', surface: '1.26' }, { nom: 'Les Charmes', surface: '4.56' }],
    TRACTEURS_LIST: [{ id: 't1', nom: 'T4.90F' }], SESSIONS: [{ id: 's1', activite: 'Griffage', conducteur: 'Marie', tracteurId: 't1', date: '2026-10-28', statut: 'En cours', avancement: 35, parcellesFaites: ['Aux Murgers', { nom: 'La Combotte' }], parcelles: ['Les Charmes'] }],
    isTractoriste: () => !!o.tract, isAdmin: () => !!o.adm, _fmtDate: (d) => d, _escHtml: (x) => String(x), _escAttr: (x) => String(x), _gnrTodayISO: () => '2026-10-28',
    _saveData: () => { appels.save++; }, renderTracteur: () => { appels.rendu++; }, showToast() {}, window: { _mvHaT: (x) => String(Math.round(x * 100) / 100).replace('.', ',') } };
  ctx.window.showToastAnnuler = (m, f) => { ctx.dernier = { m, f }; };
  const els = {}; ['trac-stat-sessions', 'trac-stat-enc', 'trac-stat-rep', 'trac-stat-h'].forEach((id, i) => { els[id] = { textContent: o.stats ? o.stats[i] : '0', parentNode: { hidden: false } }; });
  ctx.document = { getElementById: (id) => els[id] || null };
  vm.createContext(ctx); vm.runInContext(['function _trEncoursHtml(', 'function _trTerminer(', 'function _tTrouve(', 'function _tCompteurs('].map((d) => fonction(S.tr, d)).join('\n') + '\nthis.carte=_trEncoursHtml; this.fin=_trTerminer; this.trouve=_tTrouve; this.compte=_tCompteurs;', ctx);
  return { ctx, appels, els };
}
function jouer(S) {
  const A = monde(S, { tract: true }); const h = A.ctx.carte(A.ctx.SESSIONS[0]);
  t('① la carte : « En cours », l’activité, qui · quel tracteur · depuis quand, 35 %, 2,46 ha sur 7,02', h.includes('<div class="trx-k">En cours</div>') && h.includes('Griffage') && h.includes('Marie · T4.90F · depuis le 2026-10-28') && h.includes('35\u00a0%') && h.includes('2,46 ha sur 7,02'));
  t('① ses deux boutons pour qui peut saisir : « Enregistrer l’avancement » (la feuille qui existe) et « Terminer »', h.includes('class="trx-av" onclick="openSessionDetail(this.closest(\'.trx\').dataset.sid)"') && h.includes('class="trx-fin" onclick="_trTerminer(this.closest(\'.trx\').dataset.sid)"'));
  const B = monde(S, {}); t('① sans droit de saisie, la carte sans boutons', !B.ctx.carte(B.ctx.SESSIONS[0]).includes('trx-act'));
  const C = monde(S, { tract: true }); C.ctx.fin('s1'); const s = C.ctx.SESSIONS[0], fermee = s.statut === 'Terminé' && s.dateFin === '2026-10-28' && s.termineeMain === true && C.appels.save === 1;
  C.ctx.dernier.f();
  t('② « Terminer » : la session se ferme aujourd’hui (marquée à la main) ; Annuler la rouvre telle quelle, sans date de fin', fermee && s.statut === 'En cours' && !('dateFin' in s) && !('termineeMain' in s) && C.appels.save === 2 && /^Griffage terminée$/.test(C.ctx.dernier.m));
  const D = monde(S, {}); D.ctx.fin('s1'); t('② sans droit de saisie, « Terminer » ne fait rien', D.ctx.SESSIONS[0].statut === 'En cours' && D.appels.save === 0);
  const E = monde(S, { tract: true }); const s0 = E.ctx.SESSIONS[0];
  t('③ la recherche trouve l’activité, le conducteur, une parcelle faite ou prévue ; rien pour un mot absent ; tout pour un champ vide',
    E.ctx.trouve(s0, 'grif') && E.ctx.trouve(s0, 'MARIE') && E.ctx.trouve(s0, 'combotte') && E.ctx.trouve(s0, 'charmes') && !E.ctx.trouve(s0, 'buttage') && E.ctx.trouve(s0, '  '));
  const F = monde(S, { stats: ['2', '1', '0', '14 h 20'] }); F.ctx.compte();
  t('④ les compteurs à zéro disparaissent (en réparation : 0), les autres restent', F.els['trac-stat-rep'].parentNode.hidden === true && F.els['trac-stat-sessions'].parentNode.hidden === false && F.els['trac-stat-h'].parentNode.hidden === false);
  const i = S.html.indexOf('<div class="t-feuille" id="t-feuille"'), f = i >= 0 ? finBloc(S.html, i) : -1, feuille = f > 0 ? S.html.slice(i, f) : '';
  t('⑤ la carte en tête (avant les compteurs) ; les pastilles dans la feuille ; la recherche et « Filtrer » dans la barre', S.html.indexOf('<div class="trac-encours" id="trac-encours"></div>') > 0 && S.html.indexOf('<div class="trac-encours" id="trac-encours"></div>') < S.html.indexOf('<div class="mvu-kpis" id="trac-kpis">')
    && feuille.includes('id="cond-chips"') && feuille.includes('id="act-chips"') && /<div class="t-barre" id="t-barre">[\s\S]*?id="tSearch"[\s\S]*?id="t-filtrer" onclick="_tFeuille\(true\)"/.test(S.html));
  t('⑤ la liste ne reprend plus la session en cours ; le tri passe par la recherche', S.tr.includes("  sl.innerHTML=_terItems.map(function(x){return x.html;}).join('');") && S.tr.includes('return _tTrouve(s,window.fTracQ);});'));
  t('⑥ au téléphone : le « + » au-dessus de la barre, la liste garde sa marge, la feuille s’ouvre ; le bandeau laisse la place à la carte',
    S.css.includes('#page-tracteur #trac-fab{bottom:calc(env(safe-area-inset-bottom,0px) + 72px + 72px)!important;}') && S.css.includes('#page-tracteur #trac-panel-sessions{padding-bottom:calc(var(--e-8,40px) * 6)!important;}')
    && S.css.includes('body.t-feuille-ouverte #page-tracteur .t-feuille{display:block;}') && S.css.includes('#trac-enc-banner{display:none!important;}'));
  t('⑦ exposées ; la liste joue ce fichier et sa contre-épreuve', S.tr.includes('window._trTerminer=_trTerminer; window._tFeuille=_tFeuille;') && S.liste.indexOf("mv-harnais-traux1a.mjs'") > 0 && S.liste.indexOf("mv-harnais-traux1a.mjs --contre'") > 0);
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
    ['Annuler laisse la date de fin', m('tr', 'if(avant.dateFin===undefined) delete s2.dateFin; else s2.dateFin=avant.dateFin;', '')],
    ['« Terminer » pour tout le monde', m('tr', "  if(!((typeof isTractoriste==='function'&&isTractoriste())||(typeof isAdmin==='function'&&isAdmin()))) return;\n  var avant=", '  var avant=')],
    ['la session en cours revient dans la liste', m('tr', "  sl.innerHTML=_terItems.map(function(x){return x.html;}).join('');", "  sl.innerHTML=dataEnc.map(mkScard).join('')+_terItems.map(function(x){return x.html;}).join('');")],
    ['les zéros restent affichés', m('tr', 'v.parentNode.hidden=!(n>0);', 'v.parentNode.hidden=false;')],
    ['la recherche ignore les parcelles', m('tr', 'return [s.activite,s.conducteur].concat(s.parcelles||[],faites,s.produits||[])', 'return [s.activite,s.conducteur]')],
    ['le « + » recouvre de nouveau la liste', m('css', '#page-tracteur #trac-fab{bottom:calc(env(safe-area-inset-bottom,0px) + 72px + 72px)!important;}', '')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-traux1a.mjs'").join("mv-harnais-trauxZ.mjs'") })],
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
