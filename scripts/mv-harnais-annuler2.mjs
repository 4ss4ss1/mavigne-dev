/* ───────────────────────────────────────────────────────
   HARNAIS — ANNULER-2 (§472) : LE TRI DES FENÊTRES DE CONFIRMATION (docs/maquettes/maquette-ux-v1.html, partie 4)
   Lancer :          node scripts/mv-harnais-annuler2.mjs
   Contre-épreuves : node scripts/mv-harnais-annuler2.mjs --contre

   POURQUOI IL EXISTE
   La règle de la maquette : réversible et fréquent → « Annuler » ; irréversible → une fenêtre dont le bouton dit ce qu'il fait ;
   tout le domaine → taper le nom ; jamais « Oui / Non ». Ce harnais garde les trois : chaque appel à openConfirmDel qui reste
   porte un bouton nommé (lu dans ses arguments, pas dans un texte) ; les gestes passés en Annuler sont JOUÉS sur les vraies
   fonctions (retrait, Annuler, second Annuler sans doublon, à sa place) ; la zone de danger compare le nom sans accents ni
   majuscules, et ses quatre fenêtres demandent le nom.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const MOD = ['app', 'cave', 'cuvier', 'tracteur', 'phyto', 'reglages', 'admin-gt', 'reserve', 'planning'];
const S0 = { liste: lire('scripts/mv-harnais-liste.mjs') }; MOD.forEach((m) => { S0[m] = lire('src/' + m + '.js'); });
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function args(s, i0) { let i = s.indexOf('(', i0) + 1, d = 0, q = null, cur = i; const a = []; for (let k = i; k < s.length; k++) { const c = s[k];
  if (q) { if (c === '\\') { k++; continue; } if (c === q) q = null; }
  else if (c === '/' && s[k + 1] === '/') { k = s.indexOf('\n', k); if (k < 0) break; }          // un commentaire n’ouvre pas de chaîne (« l’application »)
  else if (c === '/' && s[k + 1] === '*') { k = s.indexOf('*/', k + 2) + 1; if (k <= 0) break; }
  else if ("'\"`".includes(c)) q = c; else if ('([{'.includes(c)) d++; else if (')]}'.includes(c)) { if (!d) { a.push(s.slice(cur, k).trim()); return a; } d--; } else if (c === ',' && !d) { a.push(s.slice(cur, k).trim()); cur = k + 1; } } return a; }
function appels(S) { const out = []; MOD.forEach((m) => { const s = S[m]; let i = -1; while ((i = s.indexOf('openConfirmDel(', i + 1)) >= 0) {
  const ligne = s.slice(s.lastIndexOf('\n', i) + 1, i); if (/function\s+_?openConfirmDel\s*$/.test(ligne) || ligne.trim().startsWith('//') || /typeof\s+window\.$/.test(ligne)) continue;
  if (s.slice(i - 7, i) === 'typeof ' || s.slice(i - 14, i).includes("typeof window")) continue;
  out.push({ m, a: args(s, i) }); } }); return out; }
const copie = (x) => JSON.parse(JSON.stringify(x));
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(src, debuts, ctx) { vm.createContext(ctx); vm.runInContext(debuts.map((d) => fonction(src, d)).join('\n'), ctx); return ctx; }
const toast = (ctx) => { ctx.window = ctx.window || ctx; ctx.window.showToastAnnuler = (m, f) => { ctx.dernier = { m, f }; }; ctx.showToast = () => {}; return ctx; };
function jouer(S) {
  const A = appels(S), sans = A.filter((x) => !(x.a.length >= 5 && x.a[4] && x.a[4] !== 'null' && x.a[4] !== "'Supprimer'" && !/^'(Oui|Non)'$/.test(x.a[4])));
  t('① chaque fenêtre qui reste nomme ce que fait son bouton (' + A.length + ' appels lus ; le relais du Tracteur passe le sien)', A.length >= 18 && sans.every((x) => x.a[4] === 'btnLabel'));
  t('① « Retour de … » ne dit plus « Supprimer » en rouge : « Marquer le retour », en vert', A.some((x) => x.m === 'tracteur' && /^'Retour de '/.test(x.a[0]) && x.a[4] === "'Marquer le retour'" && x.a[5] === "'#3D6B27'"));
  const conv = [['cuvier', 'function _vendMesDel('], ['cuvier', 'function _vendStatDel('], ['tracteur', 'function delRepHist('], ['tracteur', 'function deleteFiche('], ['tracteur', 'function deleteCond('], ['reglages', 'function deleteActivite('], ['cave', 'function _cavePkDel('], ['cave', 'function _caveAffRetirer(']];
  t('② les huit gestes passés en Annuler n’ouvrent plus de fenêtre', conv.every(([m, d]) => { const f = fonction(S[m], d); return f.includes('showToastAnnuler(') && !f.includes('openConfirmDel('); })
    && /var k=per\.taches\.indexOf\(nom\); if\(k<0\) return;\n    per\.taches\.splice\(k,1\);[\s\S]{0,200}window\.showToastAnnuler\(nom\+' retirée de '\+perN/.test(S.reglages));
  // le relevé
  const cv = { id: 'c1', mesures_fa: [{ id: 'm1' }, { id: 'm2', d: 1 }, { id: 'm3' }] }, sv = [];
  const R = toast(monde(S.cuvier, ['function _vendMesDel('], { CAVE_VENDANGE: { cuves_vinif: [cv] }, _vmesureCuveId: 'c1', _vmesureEditId: 'm2', _vendGarde: () => true, _vendFbSave: (m) => sv.push(m), renderVendCuves() {}, closeOv() {} }));
  R._vendMesDel(); const a1 = R.CAVE_VENDANGE.cuves_vinif[0].mesures_fa.map((x) => x.id).join(); R.dernier.f(); R.dernier.f();
  t('③ un relevé du Cuvier : supprimé sans second toast, Annuler le remet à sa place, une fois', a1 === 'm1,m3' && sv[0] === '' && R.CAVE_VENDANGE.cuves_vinif[0].mesures_fa.map((x) => x.id).join() === 'm1,m2,m3');
  // l'étape
  const ce = { id: 'c1', statut_hist: [{ id: 'e1' }, { id: 'e2' }] };
  const E = toast(monde(S.cuvier, ['function _vendStatDel('], { CAVE_VENDANGE: { cuves_vinif: [ce] }, _vstCuveId: 'c1', _vstEditId: 'e1', _vendGarde: () => true, _vendFbSave() {}, _vendSheetClose() {}, renderVendCuves() {} }));
  E._vendStatDel(); const e1 = ce.statut_hist.map((x) => x.id).join(); E.dernier.f(); E.dernier.f();
  t('③ une étape du parcours : Annuler la remet en tête, sans doublon au second appui', e1 === 'e2' && E.CAVE_VENDANGE.cuves_vinif[0].statut_hist.map((x) => x.id).join() === 'e1,e2');
  // la fiche d'entretien
  let sauves = 0; const F = toast(monde(S.tracteur, ['function deleteFiche('], { ENTRETIENS: [{ id: 'f1' }, { id: 'f2' }], isAdmin: () => true, _saveData: () => { sauves++; }, renderListeFiches() {}, renderEntretiens() {} }));
  F.deleteFiche('f1'); const f1 = F.ENTRETIENS.map((x) => x.id).join(); F.dernier.f(); F.dernier.f();
  t('③ une fiche d’entretien : Annuler la remet en tête et l’enregistre', f1 === 'f2' && F.ENTRETIENS.map((x) => x.id).join() === 'f1,f2' && sauves === 2);
  // la réparation
  const H = { t1: [{ depuis: '2026-01-02', retour: '2026-01-05' }, { depuis: '2026-03-01', retour: '2026-03-04' }] };
  const P = toast(monde(S.tracteur, ['function delRepHist('], { isAdmin: () => true, isTractoriste: () => false, _fmtDate: (d) => d, _saveData() {}, renderRepHist() {} })); P.window.REPARATEUR_HIST = H;
  P.delRepHist('t1', 1); const p1 = P.window.REPARATEUR_HIST.t1.length; P.dernier.f(); P.dernier.f();
  t('③ une réparation de l’historique : Annuler la remet à sa place (la seconde), une fois', p1 === 1 && P.window.REPARATEUR_HIST.t1.length === 2 && P.window.REPARATEUR_HIST.t1[1].depuis === '2026-03-01');
  // l'activité
  const doc = { getElementById: () => ({ value: 'Griffage' }) };
  const Ac = toast(monde(S.reglages, ['function deleteActivite('], { document: doc, renderActTracList() {} })); Ac.window.ACTIVITES = [{ nom: 'Broyage' }, { nom: 'Griffage' }]; Ac.window.saveData = () => {}; Ac.window.closeOv = () => {}; Ac.window.renderTracteur = () => {};
  Ac.deleteActivite(); const ac1 = Ac.window.ACTIVITES.map((x) => x.nom).join(); Ac.dernier.f(); Ac.dernier.f();
  t('③ une activité du Tracteur : Annuler la remet à sa place', ac1 === 'Broyage' && Ac.window.ACTIVITES.map((x) => x.nom).join() === 'Broyage,Griffage');
  // la cuve d'une cuvée
  const msgs = []; const cuvee = { id: 'v1', cuves: [{ ref: 'a', litres: 100 }, { ref: 'b', litres: 200 }] };
  const Cv = toast(monde(S.cave, ['function _caveAffRetirer('], { canWrite: () => true, CAVE_ELEVAGE: { cuvees: [cuvee] }, _caveCuve: () => ({ nom: 'Cuve A' }), openCuveeDetail() {} })); Cv.window.fbSaveToast = (o, m) => msgs.push(m);
  Cv._caveAffRetirer('v1', 'a'); const cv1 = cuvee.cuves.map((x) => x.ref).join(); Cv.dernier.f(); Cv.dernier.f();
  t('③ une cuve retirée d’une cuvée : enregistré sans second toast ; Annuler la remet à sa place, une fois', cv1 === 'b' && msgs[0] === '' && Cv.CAVE_ELEVAGE.cuvees[0].cuves.map((x) => x.ref).join() === 'a,b');
  // la zone de danger
  const btn = { cl: new Set() }, inp = { value: '', cl: new Set() }; const cls = (o) => ({ add: (x) => o.cl.add(x), remove: (x) => o.cl.delete(x) }); btn.classList = cls(btn); inp.classList = cls(inp);
  const Z = monde(S.app, ['function checkDangerConf('], { DANGER_CFG: { d: { word: 'Après-vendange 2026' } }, _dangerAction: 'd', document: { getElementById: (id) => (id === 'ovDangerBtn' ? btn : inp) } });
  inp.value = '  apres-vendange   2026 '; Z.checkDangerConf(); const ouvert = btn.cl.has('unlocked'); inp.value = 'SUPPRIMER'; Z.checkDangerConf();
  t('④ la zone de danger : le nom tapé sans accents ni majuscules ouvre, « SUPPRIMER » n’ouvre plus', ouvert && !btn.cl.has('unlocked'));
  t('④ ses quatre fenêtres demandent le nom (saison, tâche, snapshot ; écraser un snapshot)', /word:nom, btn:'Supprimer la saison'/.test(S.reglages) && /word:nom,btn:'Supprimer la tâche'/.test(S.reglages) && /word:nomSaison,/.test(S.reglages) && /word: existing>=0 \? saison\.nom : 'ARCHIVER'/.test(S.reglages));
  t('⑤ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-annuler2.mjs'") > 0 && S.liste.indexOf("mv-harnais-annuler2.mjs --contre'") > 0);
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
    ['« Retour de … » reprend le bouton rouge « Supprimer »', m('tracteur', "'Marquer le retour','#3D6B27'", "null,null")],
    ['le traitement perd son bouton nommé', m('phyto', " 'Supprimer ce traitement'", " 'Supprimer'")],
    ['le relevé revient en fin de liste', m('cuvier', 'c2.mesures_fa.splice(Math.min(i,c2.mesures_fa.length),0,m);', 'c2.mesures_fa.push(m);')],
    ['un second Annuler double l’étape', m('cuvier', 'if(c2.statut_hist.some(function(x){return x.id===e.id;})) return;', '')],
    ['Annuler de la fiche n’enregistre plus', m('tracteur', "ENTRETIENS.splice(Math.min(i,ENTRETIENS.length),0,f0); window.ENTRETIENS=ENTRETIENS;\n    _saveData('entretiens');", 'ENTRETIENS.splice(Math.min(i,ENTRETIENS.length),0,f0); window.ENTRETIENS=ENTRETIENS;\n   ')],
    ['la réparation revient en tête', m('tracteur', 'L.splice(Math.min(idx,L.length),0,copie);', 'L.splice(0,0,copie);')],
    ['l’activité perd son Annuler', m('reglages', "window.showToastAnnuler('« '+actNom+' » supprimée',function(){", "showToast('x');(function(){")],
    ['la cuve de la cuvée dit deux toasts', m('cave', "window.fbSaveToast({cave_elevage:CAVE_ELEVAGE},'');\n  dessiner();", "window.fbSaveToast({cave_elevage:CAVE_ELEVAGE},'Cuve lib\\u00e9r\\u00e9e','#B85A1A');\n  dessiner();")],
    ['la zone de danger redevient sensible aux accents', m('app', "normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')", "normalize('NFC')")],
    ['la saison redemande « SUPPRIMER »', m('reglages', "word:nom, btn:'Supprimer la saison'", "word:'SUPPRIMER', btn:'Supprimer la saison'")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-annuler2.mjs'").join("mv-harnais-annulerZ.mjs'") })],
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
