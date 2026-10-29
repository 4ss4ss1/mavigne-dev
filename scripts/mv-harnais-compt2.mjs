/* ───────────────────────────────────────────────────────
   HARNAIS — COMPT-2 (§484) : LA RÉVISION SE RECALCULE ; LE COMPTEUR EXIGÉ AU DÉMARRAGE QUAND ÇA COMPTE
   (docs/maquettes/maquette-compteur-tracteur-v1.html)
   Lancer :          node scripts/mv-harnais-compt2.mjs
   Contre-épreuves : node scripts/mv-harnais-compt2.mjs --contre

   POURQUOI IL EXISTE
   Après une révision, la cible suivante se calculait de tête et se retapait. Ce harnais JOUE les vraies fonctions de
   tracteur.js : l'ajout de mois (fin de mois comprise), l'échéance heures ET date au premier atteint, « Révision faite » qui
   calcule la suivante et s'annule, le compteur exigé au démarrage (dépassée, proche en heures ou en jours, vieux relevé ; pas
   le jour d'un relevé, pas au garage), et le tracteur non suivi jamais interrogé ; il garde les branchements.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { tr: lire('src/tracteur.js'), html: lire('index.html'), couv: lire('scripts/tutos-couverture.json'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
let ok = 0, ko = 0;
const t = (nom, cond, detail) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (detail !== undefined ? '  → ' + detail : '')); } };
const FONCS = ['function _trIso(', 'function _trJours(', 'function _trTidSession(', 'function _trHeuresNotees(', 'function _trNoteesEntre(', 'function _trEcart(', 'function _trVrais(', 'function _trCompteur(',
  'function _trSuivi(', 'function _trAjoutMois(', 'function _trDateAn(', 'function _trRevDate(', 'function _trRevEtat(', 'function _trReleveExige(', 'function _trRevFaite(', 'function _trSdOuvert(', 'function _trRelevePassage('];
function monde(S, o) {
  const ouvert = [], toasts = [];
  const sess = o.sess || [];
  const ctx = {
    TRACTEURS_LIST: o.parc, REPARATEUR: o.rep || {}, SESSIONS: sess, _trSdAvant: null, _tracSelId: o.sel || null,
    window: { ACTIVITES: [{ nom: 'Griffage', h_ha: 10 }], PARCELLES: [{ nom: 'P1', surface: '1' }], SESSIONS: sess, showToastAnnuler: (m, a) => toasts.push({ m, a }) },
    _gnrTodayISO: () => '2026-10-29', _gnrNum: (n) => String(n), _fmtDate: (d) => d, _chrNom: (x) => (typeof x === 'string' ? x : (x && x.nom) || ''), _chrMes: () => 0,
    isTractoriste: () => true, isAdmin: () => false, setTimeout: (f) => f(), showToast: (m) => toasts.push({ m }), _saveData: () => {}, renderTracteur: () => {}, renderEntretiens: () => {},
    getTracteurSel: () => o.parc.find((x) => x.id === o.sel),
    _relOuvrir: (tid, src, cb, raison) => { ouvert.push(tid + ':' + src + (raison ? ':' + raison : '')); if (cb && o.h != null) cb(o.h); },
  };
  vm.createContext(ctx);
  vm.runInContext(FONCS.map((d) => fonction(S.tr, d)).join('\n') + '\nthis.mois=_trAjoutMois; this.etat=_trRevEtat; this.exige=_trReleveExige; this.faite=_trRevFaite; this.passage=_trRelevePassage;', ctx);
  ctx.ouvert = ouvert; ctx.toasts = toasts;
  return ctx;
}
const R = (d, h) => ({ d, h, src: 'jour' });
function jouer(S) {
  const A = monde(S, { parc: [] });
  t('① l’ajout de mois : un an pile ; fin de mois gardée (31 janv. + 1 → 28 févr. ; 30 nov. + 3 → 28 févr.)',
    A.mois('2026-03-14', 12) === '2027-03-14' && A.mois('2026-01-31', 1) === '2026-02-28' && A.mois('2026-11-30', 3) === '2027-02-28', JSON.stringify([A.mois('2026-01-31', 1), A.mois('2026-11-30', 3)]));
  const e1 = A.etat({ id: 'h', revision_h: 1216, releves: [R('2026-10-27', 1000)] });
  const e2 = A.etat({ id: 'd', rev_date: '2026-11-08' });
  const e3 = A.etat({ id: 'b', revision_h: 1216, rev_date: '2026-10-20', releves: [R('2026-10-27', 1000)] });
  t('② les heures seules : 216 h, ni rouge ni orange', e1 && e1.reste === 216 && !e1.rouge && !e1.orange && !e1.depasse);
  t('② la date seule, à 10 jours : rouge (14 jours ou moins), sans heures', e2 && e2.reste === null && e2.jours === 10 && e2.rouge && !e2.depasse);
  t('② les deux : la date passée l’emporte sur 216 h — dépassée, au premier atteint', e3 && e3.depasse && e3.reste === 216);
  const X = (tr, rep) => monde(S, { parc: [tr], rep }).exige(tr);
  t('③ un tracteur non suivi (ni compteur, ni révision, ni relevé, ni intervalle) : rien n’est exigé', X({ id: 'z', nom: 'Z' }) === '');
  t('③ révision dépassée, toute proche en heures (40 h) ou en jours (7) : exigé', X({ id: 'a', revision_h: 990, releves: [R('2026-10-27', 1000)] }) === 'depassee'
    && X({ id: 'a', revision_h: 1040, releves: [R('2026-10-27', 1000)] }) === 'proche' && X({ id: 'a', revision_h: 1300, rev_date: '2026-11-05', releves: [R('2026-10-27', 1000)] }) === 'proche');
  t('③ pas de vrai relevé depuis 9 jours, ou un ancien chiffre sans date : exigé', X({ id: 'a', revision_h: 1300, releves: [R('2026-10-20', 1000)] }) === 'vieux' && X({ id: 'a', revision_h: 900, compteur_h: 482 }) === 'vieux');
  t('③ relevé il y a 2 jours et révision loin : rien ; relevé aujourd’hui, même révision proche : rien ; au garage : rien',
    X({ id: 'a', revision_h: 1300, releves: [R('2026-10-27', 1000)] }) === '' && X({ id: 'a', revision_h: 520, releves: [R('2026-10-29', 500)] }) === '' && X({ id: 'a', revision_h: 990, releves: [R('2026-10-27', 1000)] }, { a: {} }) === '');
  const ta = { id: 'a', nom: 'A', rev_h: 500, rev_mois: 12, revision_h: 1250, releves: [R('2026-10-27', 1290)] };
  const F = monde(S, { parc: [ta], sel: 'a', h: 1300 }); F.faite();
  t('④ « Révision faite » demande le compteur (feuille « revision »), puis : prochaine à 1800 h ou le 29 oct. 2027 (l’année dite), dernière à 1300 h aujourd’hui',
    F.ouvert[0] === 'a:revision' && ta.revision_h === 1800 && ta.rev_fait_h === 1300 && ta.rev_fait_d === '2026-10-29' && ta.rev_date === '2027-10-29' && /prochaine à 1800\u00a0h ou le 29 oct\. 2027/.test(F.toasts[0] && F.toasts[0].m), JSON.stringify([ta.revision_h, ta.rev_date, F.toasts[0] && F.toasts[0].m]));
  F.toasts[0].a();
  t('④ « Annuler » rend la cible et efface la révision notée', ta.revision_h === 1250 && !('rev_fait_d' in ta) && !('rev_fait_h' in ta));
  const tb = { id: 'b', nom: 'B', revision_h: 1250, releves: [R('2026-10-27', 1290)] };
  const G = monde(S, { parc: [tb], sel: 'b', h: 1300 }); G.faite();
  t('④ sans intervalle : la révision est notée, la cible ne bouge pas, la carte dit de régler l’intervalle', tb.revision_h === 1250 && tb.rev_fait_h === 1300 && /réglez l’intervalle/.test(G.toasts[0] && G.toasts[0].m));
  const P = (tr) => { const W = monde(S, { parc: [tr], sess: [{ id: 's', activite: 'Griffage', tracteurId: tr.id, date: '2026-10-29', parcellesFaites: [] }] }); W.passage('s', 'terminer'); return W.ouvert.join(','); };
  t('⑤ au passage aussi : un tracteur non suivi n’est jamais interrogé ; un tracteur suivi, oui', P({ id: 'z', nom: 'Z' }) === '' && P({ id: 'a', nom: 'A', revision_h: 900, compteur_h: 482 }) === 'a:jour');
  t('⑥ le démarrage : la session part avec le compteur quand ça compte (raison passée à la feuille)',
    S.tr.includes("if(_rx){ _relOuvrir(_tEx.id,'demarrage',function(h){ _trDemH=h; try{ saveSession(); } finally { _trDemH=null; } },_rx); return; }") && S.html.includes('<div class="rel-ban" id="rel-ban" hidden></div>'));
  t('⑥ la carte : « Révision faite », l’intervalle au crayon (heures, mois), lu à l’enregistrement',
    S.tr.includes('onclick="_trRevFaite()">R\\u00e9vision faite</button>') && S.tr.includes("_gnrField('rev-tous-h','Toutes les (h)',t.rev_h)") && S.tr.includes("document.getElementById('rev-tous-h')"));
  t('⑥ le parc de droite : la date dépassée, et « à relever »', S.tr.includes("r\\u00e9vision d\\u00e9pass\\u00e9e (date du '") && S.tr.includes("_trReleveExige(x.t)==='vieux'"));
  const ex = (JSON.parse(S.couv).exempts) || {};
  t('⑥ « Révision faite » exempté de tuto, avec sa raison ; la liste joue ce fichier et sa contre-épreuve', typeof ex._trRevFaite === 'string' && ex._trRevFaite.includes('COMPT-2') && S.liste.indexOf("mv-harnais-compt2.mjs'") > 0 && S.liste.indexOf("mv-harnais-compt2.mjs --contre'") > 0);
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
    ['la fin de mois n’est plus gardée', m('tr', 'dt.setUTCDate(Math.min(d,fin));', 'dt.setUTCDate(d);')],
    ['la date de l’intervalle est ignorée', m('tr', 'aH=!!k&&rev!=null&&rev!==\'\', dt=_trRevDate(t);', 'aH=!!k&&rev!=null&&rev!==\'\', dt=null;')],
    ['un vieux relevé n’exige plus rien', m('tr', "if(!k||!k.base.d||k.jours>=7) return 'vieux';", '')],
    ['un tracteur non suivi est interrogé au démarrage', m('tr', "if(!t||!_trSuivi(t)||(REPARATEUR&&REPARATEUR[t.id])) return '';", "if(!t||(REPARATEUR&&REPARATEUR[t.id])) return '';")],
    ['le relevé du jour n’excuse plus', m('tr', "var k=_trCompteur(t); if(k&&k.aujourdhui) return '';", 'var k=_trCompteur(t);')],
    ['« Révision faite » ne calcule plus la suivante', m('tr', 'if(hN>0) t.revision_h=Math.round((h+hN)*10)/10;', '')],
    ['au passage, un tracteur non suivi est interrogé', m('tr', "    if(typeof _trSuivi==='function'&&!_trSuivi(t)) return;", '')],
    ['le démarrage n’exige plus rien', m('tr', "if(_rx){ _relOuvrir(_tEx.id,'demarrage',", "if(false){ _relOuvrir(_tEx.id,'demarrage',")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-compt2.mjs'").join("mv-harnais-comptY.mjs'") })],
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
