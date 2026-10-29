/* ───────────────────────────────────────────────────────
   HARNAIS — COMPT-1 (§483) : LE COMPTEUR DES TRACTEURS AVANCE TOUT SEUL ; ON LE RELÈVE AU PASSAGE
   (docs/maquettes/maquette-compteur-tracteur-v1.html)
   Lancer :          node scripts/mv-harnais-compt1.mjs
   Contre-épreuves : node scripts/mv-harnais-compt1.mjs --contre

   POURQUOI IL EXISTE
   Le compteur ne bougeait que si quelqu'un le retapait (saveRev, seul geste qui l'écrivait) : l'alerte de révision se figeait,
   et cinq écrans lisaient ce chiffre figé. Ce harnais JOUE les vraies fonctions de tracteur.js (extraites par leurs accolades) :
   l'estimation (dernier relevé + heures notées × l'écart appris, les heures d'un autre tracteur écartées), les trois contrôles
   du pavé, le cadran, la question une fois par jour (jamais en entraînement, jamais pour une feuille seulement regardée) ; il
   garde les branchements (feuille refermée, Terminer, plein, crayon), les lecteurs (« dépassée de n h » partout), la feuille
   d'index.html et les quatre gestes exemptés.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { tr: lire('src/tracteur.js'), app: lire('src/app.js'), pil: lire('src/pilotage.js'), html: lire('index.html'), couv: lire('scripts/tutos-couverture.json'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond, detail) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail !== undefined ? '  → ' + detail : '')); } };
const FONCS = ['function _trIso(', 'function _trJours(', 'function _trTidSession(', 'function _trHeuresNotees(', 'function _trNoteesEntre(', 'function _trEcart(', 'function _trVrais(', 'function _trCompteur(', 'function _trHeuresTxt(', 'function _relVal(', 'function _relEtat(', 'function _relCadran(', 'function _trSdOuvert(', 'function _trRelevePassage('];
const ACTS = [{ nom: 'Griffage', h_ha: 10, tracteurDefautId: 'nh' }];
const PARCS = [{ nom: 'P1', surface: '1' }, { nom: 'P2', surface: '0.5' }];
function sessions() {
  return [
    { id: 'a', activite: 'Griffage', tracteurId: 'nh', date: '2026-10-12', parcellesFaites: ['P1'] },                       // 10 h, barème
    { id: 'b', activite: 'Griffage', tracteurId: 'New Holland', date: '2026-10-16', parcellesFaites: [{ nom: 'P1' }] },     // le tracteur par son nom
    { id: 'c', activite: 'Griffage', date: '2026-10-20', parcellesFaites: [{ nom: 'P2' }, { nom: 'P1', dmin: 60, t1: Date.UTC(2026, 9, 21, 10) }] }, // tracteur de l'activité ; 5 h barème + 1 h chrono
    { id: 'd', activite: 'Griffage', tracteurId: 'fe', date: '2026-10-20', parcellesFaites: ['P1'] },                       // un autre tracteur
  ];
}
function monde(S, o) {
  const ouvert = [], sess = o.sess || sessions();
  const ctx = {
    TRACTEURS_LIST: o.parc, REPARATEUR: o.rep || {}, SESSIONS: sess, _rel: { buf: '' }, _trSdAvant: null,
    window: { ACTIVITES: ACTS, PARCELLES: PARCS, SESSIONS: sess, __MV_TUTO: o.tuto },
    _gnrTodayISO: () => o.auj || '2026-10-22', _gnrNum: (n) => String(n), _chrNom: (x) => (typeof x === 'string' ? x : (x && x.nom) || ''),
    _chrMes: (x) => (!x || typeof x !== 'object' ? 0 : typeof x.mes === 'number' ? x.mes : typeof x.dmin === 'number' ? x.dmin : 0),
    isTractoriste: () => o.trac !== false, isAdmin: () => false, setTimeout: (f) => f(), _relOuvrir: (tid, src) => ouvert.push(tid + ':' + src),
  };
  vm.createContext(ctx);
  vm.runInContext(FONCS.map((d) => fonction(S.tr, d)).join('\n') + '\nthis.cpt=_trCompteur; this.txt=_trHeuresTxt; this.etat=_relEtat; this.cadran=_relCadran; this.passage=_trRelevePassage; this.ouvre=_trSdOuvert; this.val=function(b){ _rel.buf=b; return _relVal(); };', ctx);
  ctx.ouvert = ouvert;
  return ctx;
}
const NH = () => ({ id: 'nh', nom: 'New Holland', revision_h: 1250, compteur_h: 1026, releves: [
  { d: '2026-10-10', h: 1000, par: 'Marie', src: 'jour' }, { d: '2026-10-14', h: 1013, par: 'Marie', src: 'jour' },
  { d: '2026-10-18', h: 1026, par: 'Jean', src: 'plein' }, { d: '2026-10-19', par: 'Paul', src: 'jour', manque: true }] });
function jouer(S) {
  // ① l'estimation
  const A = monde(S, { parc: [NH(), { id: 'fe', nom: 'Fendt', releves: [{ d: '2026-10-21', h: 2018, src: 'jour' }] }, { id: 'bo', nom: 'Bobard', compteur_h: 482 }] });
  const k = A.cpt(A.TRACTEURS_LIST[0]);
  t('① l’écart appris : deux intervalles à 1,3 (13 h au cadran pour 10 h notées) → × 1,3', k && Math.abs(k.coef - 1.3) < 1e-9, k && k.coef);
  t('① estimé = dernier relevé 1026 + 6 h notées depuis (5 au barème, 1 au chrono ; pas l’autre tracteur) × 1,3 = 1033,8, « env. 1034 h »',
    k && k.h === 1033.8 && k.notees === 6 && k.estime === true && k.base.h === 1026 && k.jours === 4 && A.txt(k) === 'env.\u00a01034\u00a0h', k && JSON.stringify([k.h, k.notees, k.jours, A.txt(k)]));
  const kf = A.cpt(A.TRACTEURS_LIST[1]), kb = A.cpt(A.TRACTEURS_LIST[2]);
  t('① rien de noté depuis le relevé : le relevé tel quel, sans « env. »', kf && kf.h === 2018 && kf.estime === false && A.txt(kf) === '2018\u00a0h');
  t('① un ancien compteur sans relevé : la base, sans date, sans estimation', kb && kb.h === 482 && kb.base.d === null && kb.estime === false && kb.base.src === 'ancien');
  t('① un tracteur sans chiffre : rien d’inventé', A.cpt({ id: 'zz', nom: 'Zz' }) === null);
  const X = monde(S, { parc: [{ id: 'nh', nom: 'New Holland', releves: [{ d: '2026-10-10', h: 100 }, { d: '2026-10-14', h: 130 }, { d: '2026-10-18', h: 160 }] }] });
  const kx = X.cpt(X.TRACTEURS_LIST[0]);
  const Y = monde(S, { parc: [{ id: 'nh', nom: 'New Holland', releves: [{ d: '2026-10-10', h: 100 }, { d: '2026-10-14', h: 113 }] }] });
  const ky = Y.cpt(Y.TRACTEURS_LIST[0]);
  t('① l’écart est borné à 2 (3 mesuré) ; 1 tant qu’il y a moins de deux intervalles', kx && kx.coef === 2 && ky && ky.coef === 1, JSON.stringify([kx && kx.coef, ky && ky.coef]));
  // ② les trois contrôles du pavé
  const E = (v) => A.etat(v, k).k;
  t('② plus bas que le dernier relevé : refusé', E(1020) === 'bas');
  t('② plus de 24 h par jour écoulé (4 jours, +97 h) : refusé', E(1123) === 'imp');
  t('② beaucoup plus que l’attendu (+24 h pour +7,8) : à confirmer', E(1050) === 'beaucoup');
  t('② cohérent (+8,5 h) ; vide tant que rien n’est tapé', E(1034.5) === 'ok' && E(null) === 'vide');
  t('② sans date d’avant : seul « plus bas » compte ; premier relevé : accepté', A.etat(500, kb).k === 'ok' && A.etat(400, kb).k === 'bas' && A.etat(10, null).k === 'ok');
  // ③ le cadran
  const c = A.cadran('1189,4');
  t('③ le cadran : un chiffre par case, l’écart des milliers, le dixième à part', (c.match(/class="rel-c/g) || []).length === 5 && c.includes('<span class="rel-c rel-sep">1</span>') && c.includes('rel-dix">4<') && c.includes('rel-virg'));
  t('③ vide : quatre cases et le curseur ; « 1189, » vaut 1189, « » ne vaut rien', (A.cadran('').match(/rel-vide/g) || []).length === 4 && A.cadran('').includes('rel-curseur') && A.val('1189,') === 1189 && A.val('') === null);
  // ④ une fois par jour, au passage
  const P = (o) => { const W = monde(S, Object.assign({ parc: [NH()] }, o)); if (o.prep) o.prep(W); W.passage(o.sid || 'c', o.dou || 'terminer'); return W.ouvert.join(','); };
  t('④ « Terminer » sans relevé du jour : la feuille du compteur s’ouvre (le tracteur de l’activité)', P({}) === 'nh:jour');
  t('④ déjà relevé aujourd’hui : rien ; « pas devant le tracteur » ne compte pas comme un relevé',
    P({ prep: (W) => W.TRACTEURS_LIST[0].releves.push({ d: '2026-10-22', h: 1034, src: 'jour' }) }) === ''
    && P({ prep: (W) => W.TRACTEURS_LIST[0].releves.push({ d: '2026-10-22', par: 'Paul', src: 'jour', manque: true }) }) === 'nh:jour');
  t('④ une feuille seulement regardée ne demande rien ; cochée, elle demande', P({ dou: 'feuille', prep: (W) => W.ouvre('c') }) === '' && P({ dou: 'feuille', prep: (W) => { W.ouvre('c'); W.SESSIONS[2].parcellesFaites.push('P2'); } }) === 'nh:jour');
  t('④ jamais en entraînement, au garage, ni pour qui ne conduit pas', P({ tuto: 'tracteur' }) === '' && P({ rep: { nh: { prevu_retour: '' } } }) === '' && P({ trac: false }) === '');
  // ⑤ les branchements et les lecteurs
  t('⑤ la feuille refermée, « Terminer » et l’ouverture de la feuille sont branchés',
    S.tr.includes("if(typeof _trRelevePassage==='function') _trRelevePassage(window.tracSessionId,'feuille');") && S.tr.includes("if(typeof _trRelevePassage==='function') _trRelevePassage(id,'terminer');") && S.tr.includes("if(typeof _trSdOuvert==='function') _trSdOuvert(id);"));
  t('⑤ au plein, le compteur est exigé et part dans la fiche ; le crayon écrit un relevé « à la main »',
    S.tr.includes("_relOuvrir(t.id,'plein',function(h){ _trPleinH=h;") && S.tr.includes('if(_trPleinH!=null) fiche.compteur_h=_trPleinH;') && S.tr.includes("src:'manuel' }]).slice(-_TR_REL_MAX);"));
  t('⑤ le parc de droite et la carte Révision lisent l’estimé ; « dépassée de n h » sur la carte',
    S.tr.includes("var _k=(typeof _trCompteur==='function')?_trCompteur(t):null, comp=_k?") && S.tr.includes("sub=(reste<0?'R\\u00e9vision d\\u00e9pass\\u00e9e de '+_gnrNum(-reste)+' h'"));
  t('⑤ l’accueil, le rapport de saison et le Pilotage lisent l’estimé ; plus de « dans −n h » au rapport, à la liste et à la tuile',
    S.app.includes('window._trCompteur(tc)') && S.app.includes("(reste<0?'r\\u00e9vision d\\u00e9pass\\u00e9e de '+(-reste)+' h'") && S.pil.includes('window._trCompteur(t)')
    && S.pil.includes("(t.revReste<0?'Révision dépassée de '+_pilNum(-t.revReste):'Révision dans '+_pilNum(t.revReste))") && S.pil.includes("(_pr.revReste<0?'révision dépassée de '+_pilNum(-_pr.revReste):'prochaine révision dans '+_pilNum(_pr.revReste))"));
  t('⑤ la feuille d’index.html : douze touches, « Valider » éteint au départ, « Pas devant le tracteur »',
    (S.html.match(/onclick="_relTouche\(/g) || []).length === 12 && S.html.includes('id="rel-ok" onclick="_relValider()" disabled') && S.html.includes('onclick="_relPlusTard()">Pas devant le tracteur</button>'));
  const ex = (JSON.parse(S.couv).exempts) || {};
  t('⑤ les quatre gestes neufs exemptés, chacun avec sa raison', ['_relTouche', '_relValider', '_relPlusTard', '_trRelever'].every((n) => typeof ex[n] === 'string' && ex[n].includes('COMPT-1')));
  t('⑤ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-compt1.mjs'") > 0 && S.liste.indexOf("mv-harnais-compt1.mjs --contre'") > 0);
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
    ['l’écart appris n’est plus appliqué', m('tr', 'Number(base.h)+notees*coef', 'Number(base.h)+notees')],
    ['les heures d’un autre tracteur comptent', m('tr', 'if(!se||_trTidSession(se)!==tid) return;', 'if(!se) return;')],
    ['un relevé plus bas passe', m('tr', "  if(v<b) return {k:'bas',", "  if(false) return {k:'bas',")],
    ['l’impossible passe', m('tr', 'if(d>24*j) return', 'if(false) return')],
    ['« beaucoup » ne demande plus de confirmer', m('tr', 'if(d>att*1.5&&d-att>10) return', 'if(false) return')],
    ['la question revient plusieurs fois par jour', m('tr', 'if((t.releves||[]).some(function(r){ return r&&!r.manque&&r.d===auj; })) return;', '')],
    ['l’entraînement demande un compteur', m('tr', '    if(window.__MV_TUTO) return;', '')],
    ['une feuille seulement regardée demande un relevé', m('tr', "if(dou==='feuille'&&_trSdAvant===JSON.stringify(s.parcellesFaites||[])) return;", '')],
    ['le plein ne demande plus le compteur', m('tr', "_relOuvrir(t.id,'plein',function(h){ _trPleinH=h;", "_relOuvrirX(t.id,'plein',function(h){ _trPleinH=h;")],
    ['la liste du Pilotage écrit « dans −n h »', m('pil', "(t.revReste<0?'Révision dépassée de '+_pilNum(-t.revReste):'Révision dans '+_pilNum(t.revReste))", "'Révision dans '+_pilNum(t.revReste)")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-compt1.mjs'").join("mv-harnais-comptZ.mjs'") })],
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
