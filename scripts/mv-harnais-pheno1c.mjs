/* ───────────────────────────────────────────────────────
   HARNAIS — PHENO-1C (§508) : « OÙ EN EST LA VIGNE » DANS LE COCKPIT, ET LE TUTO « NOTER LE STADE »
   Lancer :          node scripts/mv-harnais-pheno1c.mjs
   Contre-épreuves : node scripts/mv-harnais-pheno1c.mjs --contre

   POURQUOI IL EXISTE
   La maquette veut « une carte résumée dans Pilotage › Aujourd'hui › Terrain ». Ce harnais JOUE _phenoResume (extraite d'app.js)
   à heure fixée : rien hors saison ; en saison, le stade qui couvre le plus de surface, les parcelles à noter, et la prochaine date
   prévue tirée des SEULES températures déjà gardées sur l'appareil (aucune requête depuis le cockpit) ; il JOUE htmlStades
   (extraite de cockpit-vue.js) et garde la section, son bouton, et le tuto (ses étiquettes posées dans l'appli).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { app: lire('src/app.js'), ck: lire('src/cockpit-vue.js'), tu: lire('src/tutos.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function variable(src, nom) { const i = src.indexOf('var ' + nom + '='); if (i < 0) throw new Error('introuvable : ' + nom); return src.slice(i, src.indexOf(';\n', i) + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function saison15() { const o = {}; let d = new Date('2026-03-01T12:00:00'); while (d.toISOString().slice(0, 10) <= '2026-10-31') { o[d.toISOString().slice(0, 10)] = 15; d.setDate(d.getDate() + 1); } return o; }
function monde(S, o) {
  const P = [{ nom: 'Les Crais', pid: 'p1', cepage: 'Pinot noir', surface: '0.5' }, { nom: 'Aux Combottes', pid: 'p2', cepage: 'Pinot noir', surface: '1.6' }, { nom: 'Clos Prieur', pid: 'p3', cepage: 'Pinot noir', surface: '1.2' }];
  const store = {}; let fetches = 0;
  if (o.cache) store['mvPhenoT1:47.230,4.970:2026'] = JSON.stringify(o.cache);
  const ctx = { window: { PARCELLES: P, PHENO: o.pheno || {} }, todayStr: () => o.auj, isAdmin: () => true, getDomaineGeo: () => ({ lat: 47.23, lng: 4.97 }),
    localStorage: { getItem: (k) => (k in store ? store[k] : null) }, fetch: () => { fetches++; return Promise.reject(new Error('non')); } };
  vm.createContext(ctx);
  vm.runInContext([variable(S.app, '_PHENO_STADES'), variable(S.app, '_PHENO_MOIS'), variable(S.app, '_PHENO_GFV'), variable(S.app, '_PHENO_GFV_NOM'),
    ...['_phenoAdm', '_phenoStade', '_phenoAn', '_phenoListe', '_phenoDernier', '_phenoCepages', '_phenoEnSaison', '_phenoGroupe', '_phenoCuvees', '_phenoLignes', '_phenoVue', '_phenoJour', '_phenoNorm', '_phenoJourSuiv', '_phenoSerie', '_phenoCumuls', '_phenoCumulAu', '_phenoDateSeuil', '_phenoPrevisions', '_phenoCle', '_phenoResume'].map((n) => fonction(S.app, 'function ' + n + '('))].join('\n')
    + '\nthis.resume=_phenoResume;', ctx);
  return { ctx, fetches: () => fetches };
}
function htmlStades(S, r) {
  const c = { window: { _phenoResume: () => r }, esc: (s) => String(s).replace(/</g, '&lt;'), ICO: { feuille: '' }, entete: (ti, ca, i, id, dr) => '<h2>' + ti + '</h2><p>' + ca + '</p>' + (dr || '') };
  vm.createContext(c); vm.runInContext(fonction(S.ck, 'function htmlStades(') + '\nthis.h=htmlStades;', c); return c.h();
}
function jouer(S) {
  t('① hors saison : rien (le cockpit n’affiche pas la carte)', monde(S, { auj: '2026-11-08' }).ctx.resume() === null);
  const obs = Object.fromEntries(Object.entries(saison15()).filter(([d]) => d <= '2026-05-24'));
  const clim = Object.fromEntries(Object.entries(saison15()).map(([d, v]) => [d.slice(5), v]));
  const A = monde(S, { auj: '2026-05-25', pheno: { 2026: [{ pid: 'p2', b: 57, d: '2026-05-22' }, { pid: 'p3', b: 57, d: '2026-05-22' }, { pid: 'p1', b: 61, d: '2026-05-10' }] }, cache: { jour: '2026-05-25', obs, prev: {}, clim } });
  const r = A.ctx.resume();
  t('② en saison : le stade dominant en surface (séparés, 2,8 ha sur 3,3), les parcelles à noter (Les Crais, 15 jours)', r && r.phrase === 'Boutons séparés sur les trois quarts du domaine noté' && r.aNoter === 1 && r.notees === 3 && r.total === 3);
  t('② la prochaine date, tirée des températures gardées (pleine floraison du Pinot noir le 21 mai est passée → la véraison, 15 août) ; aucune requête', r.prochaine && r.prochaine.lib === 'Véraison, Pinot noir' && r.prochaine.quand === 'vers le 15 août, à une semaine près' && A.fetches() === 0);
  const B = monde(S, { auj: '2026-05-25', pheno: {} }).ctx.resume();
  t('② sans températures gardées : pas de date, et rien d’inventé', B && B.prochaine === null && B.phrase === '' && B.aNoter === 3);
  const h = htmlStades(S, r), h0 = htmlStades(S, null);
  t('③ la carte : son titre, le stade, la date, l’alerte, le bouton vers le relevé ; rien hors saison', h.includes('Où en est la vigne') && h.includes('Boutons séparés sur les trois quarts') && h.includes('<b>vers le 15 août, à une semaine près</b>') && h.includes('1 parcelle à noter') && h.includes('data-fn="releve"') && h0 === '');
  t('③ le cockpit : la section dans la colonne d’« À savoir », cachée sans contenu ; le bouton mène au relevé', S.ck.includes('<section class="ck-stades ck-panneau" id="ck-stades" aria-label="Où en est la vigne" hidden></section>') && S.ck.includes('st.innerHTML = hs; st.hidden = !hs;') && S.ck.includes("fn.dataset.fn === 'releve') { if (typeof window._phenoAllerReleve === 'function') window._phenoAllerReleve(); return; }"));
  t('④ le tuto « noter le stade » : la fiche, « Noter le stade », un stade, Enregistrer ; ses étiquettes posées dans l’appli', /\{ id: 'stade', titre: 'Comment faire pour noter le stade d’une parcelle/.test(S.tu) && ['parc.ligne', 'dp.stade', 'phn.stade', 'phn.ok', 'dp.stade.v'].every((e) => S.tu.includes('data-tuto="' + e + '"') && S.app.includes('data-tuto="' + e + '"')));
  { const c = {}; vm.createContext(c); vm.runInContext(fonction(S.tu, 'function _semaineOuvree(') + '\nthis.f=_semaineOuvree;', c);
    t('④ le tuto des journées de cave : la semaine du mois sans jour ouvré (dimanche 1er novembre, samedi 1er août) le fait passer sur le mois ; un mercredi 1er juillet, non', c.f('2026-11-01') === false && c.f('2026-08-01') === false && c.f('2026-07-01') === true && c.f('2026-11-02') === true
      && S.tu.includes("if (!_semaineOuvree() && typeof window.pl2SetView === 'function') window.pl2SetView('mo');")); }
  t('⑤ exposée ; la liste joue ce fichier et sa contre-épreuve', S.app.includes('window._phenoResume=_phenoResume;') && S.liste.indexOf("mv-harnais-pheno1c.mjs'") > 0 && S.liste.indexOf("mv-harnais-pheno1c.mjs --contre'") > 0);
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
    ['la carte aussi hors saison', m('app', "  var auj=todayStr(); if(!_phenoEnSaison(auj)) return null;\n  var an=_phenoAn(), V=_phenoVue(an,auj), notees", "  var auj=todayStr();\n  var an=_phenoAn(), V=_phenoVue(an,auj), notees")],
    ['une date déjà passée donnée pour prochaine', m('app', "if(q[1].d&&!q[1].vu&&q[1].d>=auj&&(!best||q[1].d<best.d))", "if(q[1].d&&!q[1].vu&&(!best||q[1].d<best.d))")],
    ['la section ne se cache plus sans contenu', m('ck', 'st.innerHTML = hs; st.hidden = !hs;', 'st.innerHTML = hs;')],
    ['le bouton ne mène plus au relevé', m('ck', "if (typeof window._phenoAllerReleve === 'function') window._phenoAllerReleve(); return; }", "return; }")],
    ['une étiquette du tuto disparaît de l’appli', m('app', 'data-tuto="phn.ok"', 'data-tuto="phn.okk"')],
    ['le tuto des journées de cave ne bascule plus sur le mois', m('tu', "if (!_semaineOuvree() && typeof window.pl2SetView === 'function') window.pl2SetView('mo');", '')],
    ['la semaine compte aussi le week-end', m('tu', 'for (var i = 0; i < 5; i++)', 'for (var i = 0; i < 7; i++)')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-pheno1c.mjs'").join("mv-harnais-phenoZc.mjs'") })],
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
