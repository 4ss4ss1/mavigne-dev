/* ───────────────────────────────────────────────────────
   HARNAIS — COMPT-5 (§487) : PLUSIEURS ENTRETIENS PAR TRACTEUR (docs/maquettes/maquette-compteur-tracteur-v1.html)
   Lancer :          node scripts/mv-harnais-compt5.mjs
   Contre-épreuves : node scripts/mv-harnais-compt5.mjs --contre

   POURQUOI IL EXISTE
   Un tracteur n'avait qu'une révision. Ce harnais JOUE les vraies fonctions de tracteur.js : l'échéance de chaque entretien au
   premier atteint (heures au compteur estimé, mois), les seuils à la mesure de l'intervalle (un graissage de 50 h n'est pas
   rouge en permanence), le plus urgent (dépassé d'abord), qui remonte au parc et compte pour le compteur exigé, le formulaire de
   l'admin (nom, intervalle, retrait annulable), « Fait » qui demande le compteur et calcule le suivant, et « Fait aussi » dans
   « Révision faite ».
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
const FONCS = ['_trIso', '_trJours', '_trTidSession', '_trHeuresNotees', '_trNoteesEntre', '_trEcart', '_trVrais', '_trCompteur', '_trSuivi', '_trAjoutMois', '_trDateAn', '_trRevDate', '_trRevEtat', '_trReleveExige',
  '_trEntEtat', '_trEntTexte', '_trEntIntervalle', '_trEntPlusUrgent', '_trEntUrgent', '_trEntSave', '_trEntSuppr', '_trEntFait', '_trRevFaite'].map((n) => 'function ' + n + '(');
function monde(S, o) {
  const toasts = [], vals = o.vals || {};
  const ctx = {
    TRACTEURS_LIST: o.parc, REPARATEUR: {}, SESSIONS: [], _entProgEdit: o.edit === undefined ? null : o.edit, _rel: { faits: o.faits || [] }, _tracSelId: o.parc[0] && o.parc[0].id,
    window: { ACTIVITES: [], PARCELLES: [], SESSIONS: [], showToastAnnuler: (m, a) => toasts.push({ m, a }) },
    document: { getElementById: (id) => (id in vals ? { value: vals[id] } : null) },
    _gnrTodayISO: () => '2026-10-29', _gnrNum: (n) => String(n), _fmtDate: (d) => d, _escHtml: (x) => String(x), _chrNom: (x) => (typeof x === 'string' ? x : (x && x.nom) || ''), _chrMes: () => 0,
    isAdmin: () => o.admin !== false, isTractoriste: () => true, showToast: (m) => toasts.push({ m }), _saveData: () => {}, renderTracteur: () => {}, renderEntretiens: () => {},
    getTracteurSel: () => o.parc[0], _relOuvrir: (tid, src, cb) => { if (cb && o.h != null) cb(o.h); },
  };
  vm.createContext(ctx);
  vm.runInContext(FONCS.map((d) => fonction(S.tr, d)).join('\n') + '\nthis.etat=_trEntEtat; this.texte=_trEntTexte; this.urg=_trEntPlusUrgent; this.suff=_trEntUrgent; this.exige=_trReleveExige; this.save=_trEntSave; this.suppr=_trEntSuppr; this.fait=_trEntFait; this.revFaite=_trRevFaite;', ctx);
  ctx.toasts = toasts;
  return ctx;
}
const E = () => ({
  e1: { id: 'ep1', nom: 'Vidange pont et bo\u00eete', tous_h: 1000, fait_h: 520 },
  e2: { id: 'ep2', nom: 'Graissage', tous_h: 50, fait_h: 1150 },
  e3: { id: 'ep3', nom: 'Filtre \u00e0 air cabine', tous_mois: 12, fait_d: '2025-11-05' },
  e4: { id: 'ep4', nom: 'Courroie', tous_h: 2000 },
  e5: { id: 'ep5', nom: 'Vidange moteur', tous_h: 1000, fait_h: 520, tous_mois: 12, fait_d: '2025-10-20' } });
const TR = (prog, d) => ({ id: 'nh', nom: 'NH', revision_h: 1700, releves: [{ d: d || '2026-10-29', h: 1186, src: 'jour' }], entretiens_prog: prog });
function jouer(S) {
  const x = E(), A = monde(S, { parc: [TR([x.e1, x.e2, x.e3, x.e4, x.e5])] }), tr = A.TRACTEURS_LIST[0];
  const s1 = A.etat(tr, x.e1), s3 = A.etat(tr, x.e3), s4 = A.etat(tr, x.e4), s5 = A.etat(tr, x.e5);
  t('① l’échéance aux heures : 520 + 1 000 = 1 520, dans 334 h, sans couleur', s1.ph === 1520 && s1.reste === 334 && !s1.rouge && !s1.orange && A.texte(x.e1, s1) === 'dans 334\u00a0h');
  t('① aux mois : 5 nov. 2025 + 12 mois → le 5 nov. 2026, à 7 jours : rouge', s3.pd === '2026-11-05' && s3.jours === 7 && s3.rouge && A.texte(x.e3, s3) === 'le 5 nov. 2026');
  t('① les deux, au premier atteint : la date passée l’emporte sur 334 h ; jamais noté : rien d’inventé', s5.depasse && A.texte(x.e5, s5) === 'dans 334\u00a0h ou date d\u00e9pass\u00e9e' && !s4.connu && A.texte(x.e4, s4) === 'jamais not\u00e9');
  const g = (fh) => A.etat(tr, { tous_h: 50, fait_h: fh });
  t('② les seuils suivent l’intervalle : un graissage de 50 h à 14 h, rien ; à 10 h, orange ; à 4 h, rouge', !g(1150).rouge && !g(1150).orange && g(1146).orange && g(1140).rouge, JSON.stringify([g(1150).reste, g(1146).reste, g(1140).reste]));
  const U = monde(S, { parc: [TR([x.e1, { id: 'g', nom: 'Graissage', tous_h: 50, fait_h: 1140 }, x.e5])] });
  t('③ le plus urgent : le dépassé avant le rouge ; il remonte au parc', U.urg(U.TRACTEURS_LIST[0]).e.id === 'ep5' && U.suff(U.TRACTEURS_LIST[0]) === ' \u00b7 Vidange moteur dans 334\u00a0h ou date d\u00e9pass\u00e9e');
  const X = (prog) => { const W = monde(S, { parc: [TR(prog, '2026-10-27')] }); return W.exige(W.TRACTEURS_LIST[0]); };
  t('④ le compteur exigé au démarrage : un entretien rouge → « proche », dépassé → « dépassée » ; sans eux, rien', X([{ id: 'g', nom: 'G', tous_h: 50, fait_h: 1140 }]) === 'proche' && X([x.e5]) === 'depassee' && X([x.e1]) === '');
  const B = monde(S, { parc: [TR([])], edit: 'nouveau', vals: { 'ep-nom': '', 'ep-tous-h': '1000', 'ep-tous-mois': '', 'ep-fait-h': '', 'ep-fait-d': '' } }); B.save();
  const C = monde(S, { parc: [TR([])], edit: 'nouveau', vals: { 'ep-nom': 'Vidange pont', 'ep-tous-h': '', 'ep-tous-mois': '', 'ep-fait-h': '', 'ep-fait-d': '' } }); C.save();
  t('⑤ l’admin enregistre : sans nom, refusé ; sans intervalle, refusé', B.TRACTEURS_LIST[0].entretiens_prog.length === 0 && /nom/.test(B.toasts[0].m) && C.TRACTEURS_LIST[0].entretiens_prog.length === 0 && /intervalle/.test(C.toasts[0].m));
  const D = monde(S, { parc: [TR([])], edit: 'nouveau', vals: { 'ep-nom': 'Vidange pont', 'ep-tous-h': '1000', 'ep-tous-mois': '24', 'ep-fait-h': '520', 'ep-fait-d': '2025-05-10' } }); D.save();
  const dn = D.TRACTEURS_LIST[0].entretiens_prog[0];
  t('⑤ un nouvel entretien : nom, heures, mois, dernière fois ; le formulaire se referme', dn && dn.nom === 'Vidange pont' && dn.tous_h === 1000 && dn.tous_mois === 24 && dn.fait_h === 520 && dn.fait_d === '2025-05-10' && D._entProgEdit === null && /^ep/.test(dn.id));
  const N = monde(S, { parc: [TR([E().e1])], edit: 'nouveau', admin: false, vals: { 'ep-nom': 'X', 'ep-tous-h': '10' } }); N.save();
  const F = monde(S, { parc: [TR([E().e1, E().e2])], edit: 'ep1' }); F.suppr();
  t('⑤ un non-admin n’enregistre rien ; « Retirer » puis « Annuler » remet l’entretien à sa place', N.TRACTEURS_LIST[0].entretiens_prog.length === 1 && F.TRACTEURS_LIST[0].entretiens_prog.length === 1 && (F.toasts[0].a(), F.TRACTEURS_LIST[0].entretiens_prog[0].id === 'ep1'));
  const G = monde(S, { parc: [TR([E().e1])], h: 1520 }); G.fait('ep1'); const ge = G.TRACTEURS_LIST[0].entretiens_prog[0];
  t('⑥ « Fait » demande le compteur : noté à 1 520 h aujourd’hui, prochain à 2 520 h ; « Annuler » le défait', ge.fait_h === 1520 && ge.fait_d === '2026-10-29' && /prochain \u00e0 2520\u00a0h/.test(G.toasts[0].m) && (G.toasts[0].a(), ge.fait_h === 520 && !('fait_d' in ge)));
  const H = monde(S, { parc: [Object.assign(TR([E().e1, E().e2]), { rev_h: 500 })], h: 1190, faits: ['ep2'] }); H.revFaite(); const he = H.TRACTEURS_LIST[0].entretiens_prog;
  t('⑦ « Révision faite » coche aussi « Fait aussi » : le graissage noté à 1 190 h, pas la vidange ; dit dans le toast ; « Annuler » le défait',
    he[1].fait_h === 1190 && he[1].fait_d === '2026-10-29' && he[0].fait_h === 520 && /Graissage aussi/.test(H.toasts[0].m) && (H.toasts[0].a(), he[1].fait_h === 1150 && !('fait_d' in he[1])));
  t('⑧ la carte suit la révision (deux endroits) ; « Fait aussi » dans la feuille ; le parc et le démarrage lisent le plus urgent',
    (S.tr.match(/\+\(typeof _trEntProgHtml==='function'\?_trEntProgHtml\(t\):''\)/g) || []).length === 2 && S.html.includes('<div class="rel-faits" id="rel-faits" hidden></div>') && S.tr.includes('Fait aussi\\u00a0:') && S.tr.includes('_trEntUrgent(x.t)') && S.tr.includes('_trEntPlusUrgent(t):null;'));
  const ex = (JSON.parse(S.couv).exempts) || {};
  t('⑧ six gestes neufs exemptés, avec leur raison ; la liste joue ce fichier et sa contre-épreuve', ['_trEntEdit', '_trEntAnnuler', '_trEntSave', '_trEntSuppr', '_trEntFait', '_relFait'].every((n) => typeof ex[n] === 'string' && ex[n].includes('COMPT-5')) && S.liste.indexOf("mv-harnais-compt5.mjs'") > 0 && S.liste.indexOf("mv-harnais-compt5.mjs --contre'") > 0);
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
    ['des seuils fixes au lieu de la mesure de l’intervalle', m('tr', 'var sr=Math.max(5,th*0.1), so=Math.max(10,th*0.25);', 'var sr=50, so=120;')],
    ['les mois sont ignorés', m('tr', 'pd=aD?_trAjoutMois(String(e.fait_d),tm):null', 'pd=null')],
    ['le dépassé ne passe plus avant le rouge', m('tr', 'var rang=s.depasse?0:s.rouge?1:s.orange?2:3;', 'var rang=s.rouge?1:s.orange?2:3;')],
    ['le démarrage ignore les autres entretiens', m('tr', "if(_eu&&_eu.depasse) return 'depassee'; if(_eu&&_eu.rouge) return 'proche';", '')],
    ['un entretien sans intervalle s’enregistre', m('tr', 'if(!(th>0)&&!(tm>0)){ showToast(', 'if(false){ showToast(')],
    ['« Fait » ne note plus rien', m('tr', 'var av={h:e.fait_h, d:e.fait_d}; e.fait_h=h; e.fait_d=_gnrTodayISO();', 'var av={h:e.fait_h, d:e.fait_d};')],
    ['« Révision faite » ignore « Fait aussi »', m('tr', '_avEp.push({e:e, h:e.fait_h, d:e.fait_d}); e.fait_h=h; e.fait_d=auj;', '_avEp.push({e:e, h:e.fait_h, d:e.fait_d});')],
    ['la carte n’est plus branchée', m('tr', "+(typeof _trEntProgHtml==='function'?_trEntProgHtml(t):'')", '')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-compt5.mjs'").join("mv-harnais-comptV.mjs'") })],
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
