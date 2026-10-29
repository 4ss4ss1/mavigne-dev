/* ───────────────────────────────────────────────────────
   HARNAIS — COMPT-3 (§485) : LA FICHE DU COMPTEUR, SUR ORDINATEUR (docs/maquettes/maquette-compteur-tracteur-v1.html)
   Lancer :          node scripts/mv-harnais-compt3.mjs
   Contre-épreuves : node scripts/mv-harnais-compt3.mjs --contre

   POURQUOI IL EXISTE
   L'admin voyait un chiffre estimé sans pouvoir juger s'il tenait, ni retirer un relevé faux. Ce harnais JOUE les vraies
   fonctions de tracteur.js : les jours ouvrés (lundi-vendredi), le rythme au compteur sur 4 semaines et le repère de révision,
   l'écart à l'estimé de chaque relevé, la fiche (appris, courbe, relevés, boutons de l'admin seulement), « Écarter » qui retire
   un chiffre du calcul sans l'effacer, recalcule le dernier relevé et s'annule ; il garde le branchement et l'affichage
   réservé à l'ordinateur.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { tr: lire('src/tracteur.js'), html: lire('index.html'), css: lire('src/styles.css'), couv: lire('scripts/tutos-couverture.json'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond, detail) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail !== undefined ? '  → ' + detail : '')); } };
const FONCS = ['_trIso', '_trJours', '_trTidSession', '_trHeuresNotees', '_trNoteesEntre', '_trEcart', '_trVrais', '_trCompteur', '_trHeuresTxt', '_trSuivi', '_trAjoutMois', '_trDateAn', '_trRevDate', '_trRevEtat',
  '_trUtc', '_trFerie', '_trJoursOuvres', '_trAjoutOuvres', '_trRythme', '_trRepere', '_trLignesReleves', '_trCourbeSvg', '_trFicheCptHtml', '_trRelEcarte'].map((n) => 'function ' + n + '(');
function monde(S, o) {
  const toasts = [];
  const ctx = {
    TRACTEURS_LIST: o.parc, REPARATEUR: {}, SESSIONS: [],
    window: { ACTIVITES: [], PARCELLES: [], SESSIONS: [], showToastAnnuler: (m, a) => toasts.push({ m, a }) },
    _gnrTodayISO: () => '2026-10-29', _gnrNum: (n) => String(n), _fmtDate: (d) => d, _escHtml: (x) => String(x), _escAttr: (x) => String(x), _trHeuresFr: (h) => (Math.round(h * 10) / 10).toString().replace('.', ','),
    _chrNom: (x) => (typeof x === 'string' ? x : (x && x.nom) || ''), _chrMes: () => 0, isAdmin: () => !!o.admin, showToast: (m) => toasts.push({ m }), _saveData: () => {}, renderTracteur: () => {}, renderEntretiens: () => {},
  };
  vm.createContext(ctx);
  const src = (S.tr.match(/var _TR_SRC=\{[^}]*\};/) || [''])[0];
  vm.runInContext(src + '\n' + FONCS.map((d) => fonction(S.tr, d)).join('\n') + '\nthis.jo=_trJoursOuvres; this.plus=_trAjoutOuvres; this.ry=_trRythme; this.rep=_trRepere; this.lignes=_trLignesReleves; this.fiche=_trFicheCptHtml; this.ecarte=_trRelEcarte; this.cpt=_trCompteur;', ctx);
  ctx.toasts = toasts;
  return ctx;
}
const NH = () => ({ id: 'nh', nom: 'New Holland', revision_h: 1250, compteur_h: 1186, releves: [
  { d: '2026-10-01', ts: 1, h: 1094, src: 'jour', par: 'Paul' }, { d: '2026-10-20', ts: 2, h: 1154, src: 'jour', par: 'Marie' },
  { d: '2026-10-23', ts: 3, h: 1163.5, src: 'plein', par: 'Jean' }, { d: '2026-10-22', ts: 4, par: 'Jean', src: 'jour', manque: true },
  { d: '2026-10-29', ts: 5, h: 1186, src: 'jour', par: 'Marie' }] });
function jouer(S) {
  const A = monde(S, { parc: [NH()], admin: true }), nh = A.TRACTEURS_LIST[0];
  t('① les jours ouvrés : du vendredi au lundi, 1 ; du lundi au vendredi, 4 ; 14 jours ouvrés après le jeudi 29 oct. → le 18 nov.',
    A.jo('2026-10-23', '2026-10-26') === 1 && A.jo('2026-10-26', '2026-10-30') === 4 && A.plus('2026-10-29', 14) === '2026-11-18', JSON.stringify([A.jo('2026-10-23', '2026-10-26'), A.jo('2026-10-26', '2026-10-30'), A.plus('2026-10-29', 14)]));
  const ry = A.ry(nh), rp = A.rep(nh);
  t('② le rythme au compteur sur 4 semaines : 92 h en 20 jours ouvrés = 4,6 h ; le repère : 64 h ÷ 4,6 → 14 jours ouvrés, le 18 nov.',
    ry && Math.abs(ry.h - 4.6) < 1e-9 && rp && rp.n === 14 && rp.d === '2026-11-18', JSON.stringify([ry, rp]));
  const L = A.lignes(nh);
  t('③ les relevés du plus récent au plus ancien, « pas devant » compris ; l’écart à l’estimé : +22,5, +9,5, +60 (rien de noté entre deux)',
    L.length === 5 && L[0].r.ts === 5 && L[2].r.manque && Math.abs(L[0].ecart - 22.5) < 1e-9 && Math.abs(L[1].ecart - 9.5) < 1e-9 && Math.abs(L[3].ecart - 60) < 1e-9 && L[4].ecart === null, JSON.stringify(L.map((x) => x.ecart)));
  const h = A.fiche(nh);
  t('④ la fiche : appris (pas encore d’écart), rythme et repère dits comme un repère, la courbe avec la révision et le repère',
    h.includes('pas encore appris') && h.includes('<b>4,6\u00a0h</b> par jour ouvr\u00e9 au compteur') && h.includes('environ 14 jours ouvr\u00e9s, vers le 18 nov. 2026') && h.includes('un rep\u00e8re, pas une date promise')
    && h.includes('<svg') && h.includes('R\u00e9vision \u00e0 1250\u00a0h') && h.includes('rep\u00e8re 18 nov. 2026'));
  t('④ le tableau : « pas devant le tracteur », le plein, les écarts signés ; « Écarter » pour l’admin',
    h.includes('\u00ab\u00a0pas devant le tracteur\u00a0\u00bb') && h.includes('<td>plein</td>') && h.includes('+22.5\u00a0h') && h.includes('+60\u00a0h') && h.includes("onclick=\"_trRelEcarte('nh',5)\">\u00c9carter</button>"));
  const B = monde(S, { parc: [NH()], admin: false });
  t('④ sans droit d’admin : aucun bouton ; un tracteur non suivi : pas de fiche', !B.fiche(B.TRACTEURS_LIST[0]).includes('_trRelEcarte') && A.fiche({ id: 'z', nom: 'Z' }) === '');
  B.ecarte('nh', 5);
  t('⑤ un non-admin n’écarte rien', !B.TRACTEURS_LIST[0].releves[4].ecarte && B.TRACTEURS_LIST[0].compteur_h === 1186);
  A.ecarte('nh', 5);
  const k = A.cpt(nh);
  t('⑤ « Écarter » : le relevé reste écrit mais ne compte plus — le dernier vrai relevé redevient 1163,5, barré dans la fiche',
    nh.releves[4].ecarte === true && nh.compteur_h === 1163.5 && k.h === 1163.5 && A.fiche(nh).includes('cpt-ecarte') && /Relev\u00e9 \u00e9cart\u00e9 \u00b7 1186\u00a0h ne compte plus/.test(A.toasts[0] && A.toasts[0].m));
  A.toasts[0].a();
  t('⑤ « Annuler » le remet, avec le dernier relevé', !nh.releves[4].ecarte && nh.compteur_h === 1186);
  t('⑥ la fiche a sa zone, pleine largeur sous les deux colonnes de l’Entretien, et seulement sur ordinateur (1 024 px)',
    S.tr.includes("if(_cz) _cz.innerHTML=(typeof _trFicheCptHtml==='function')?_trFicheCptHtml(t):'';") && S.html.includes('<div id="cpt-fiche-zone"></div>') && S.css.includes('#page-tracteur #trac-panel-entretiens > #cpt-fiche-zone{grid-column:1 / -1;min-width:0}') && S.css.includes('.cpt-fiche{display:none}') && S.css.includes('@media (min-width:1024px){ #page-tracteur .cpt-fiche{display:block} }'));
  const ex = (JSON.parse(S.couv).exempts) || {};
  t('⑥ « Écarter » exempté de tuto, avec sa raison ; la liste joue ce fichier et sa contre-épreuve', typeof ex._trRelEcarte === 'string' && ex._trRelEcarte.includes('COMPT-3') && S.liste.indexOf("mv-harnais-compt3.mjs'") > 0 && S.liste.indexOf("mv-harnais-compt3.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  { const log = console.log; console.log = () => {}; ok = 0; ko = 0; try { jouer(S0); } catch (e) { ko++; } console.log = log;
    if (ko) { console.log('\x1b[31mROUGE\x1b[0m — la base n’est pas verte (' + ko + ' échec(s)) : contre-épreuves sans valeur'); process.exit(1); } }
  const m = (cle, a, b) => (S) => { if (!S[cle].includes(a)) throw new Error('ancre absente'); return Object.assign({}, S, { [cle]: S[cle].split(a).join(b) }); };
  const mutants = [
    ['un relevé écarté compte encore', m('tr', 'return r&&!r.manque&&!r.ecarte&&r.d&&', 'return r&&!r.manque&&r.d&&')],
    ['« Écarter » ne recalcule pas le dernier relevé', m('tr', 'var v=_trVrais(t); if(v.length) t.compteur_h=Number(v[v.length-1].h);', '')],
    ['les week-ends comptent comme des jours ouvrés', m('tr', 'if(w>=1&&w<=5&&!_trFerie(d)) n++;', 'n++;')],
    ['le repère oublie le rythme', m('tr', 'var n=Math.ceil(e.reste/r.h);', 'var n=Math.ceil(e.reste);')],
    ['l’écart à l’estimé ne se calcule plus', m('tr', 'if(vrai&&prev) ecart=', 'if(false) ecart=')],
    ['un non-admin écarte', m('tr', "if(!isAdmin()){ showToast('R\\u00e9serv\\u00e9 \\u00e0 l\\u2019admin','#C0392B'); return; }", '')],
    ['la fiche n’est plus rendue', m('tr', "if(_cz) _cz.innerHTML=(typeof _trFicheCptHtml==='function')?_trFicheCptHtml(t):'';", '')],
    ['la fiche retombe dans la colonne étroite', m('css', '#page-tracteur #trac-panel-entretiens > #cpt-fiche-zone{grid-column:1 / -1;min-width:0}', '')],
    ['la fiche s’affiche au téléphone', m('css', '.cpt-fiche{display:none}', '.cpt-fiche{display:block}')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-compt3.mjs'").join("mv-harnais-comptX.mjs'") })],
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
