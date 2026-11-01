/* ───────────────────────────────────────────────────────
   HARNAIS — PHENO-1B (§507) : CE QUI VIENT — LA SOMME DE TEMPÉRATURES ET LA PRÉVISION GFV, RECALÉE PAR LES STADES NOTÉS
   Lancer :          node scripts/mv-harnais-pheno1b.mjs
   Contre-épreuves : node scripts/mv-harnais-pheno1b.mjs --contre

   POURQUOI IL EXISTE
   Une prévision de floraison fausse d'une semaine fait rater un traitement. Ce harnais JOUE les vraies fonctions (extraites
   d'app.js) sur une saison fabriquée (15 °C chaque jour depuis le 1er mars) dont on connaît les dates à la main : 1 219 °C·j le
   21 mai, 2 511 le 15 août ; une pleine floraison notée le 11 mai (1 080 °C·j) décale la véraison de −139, au 6 août. Il garde
   l'ordre des sources (l'observé, puis la prévision, puis la moyenne des dix ans), les seuils publiés et eux seuls, la carte
   (hors saison, en lecture, en panne, complète), l'hôte de l'archive permis par la politique de sécurité, la carte posée.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { app: lire('src/app.js'), fb: lire('firebase.json'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function variable(src, nom) { const i = src.indexOf('var ' + nom + '='); if (i < 0) throw new Error('introuvable : ' + nom); return src.slice(i, src.indexOf(';\n', i) + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, o) {
  const P = [{ nom: 'Les Crais', pid: 'p1', cepage: 'Pinot Noir' }, { nom: 'Champerrier', pid: 'p5', cepages: ['Chardonnay'] }, { nom: 'Aligoté', pid: 'p9', cepage: 'Aligoté' }];
  const ctx = { window: { PARCELLES: P, PHENO: o.pheno || {} }, _escHtml: (x) => String(x), todayStr: () => '2026-05-25' };
  vm.createContext(ctx);
  vm.runInContext([variable(S.app, '_PHENO_STADES'), variable(S.app, '_PHENO_MOIS'), variable(S.app, '_PHENO_GFV'), variable(S.app, '_PHENO_GFV_NOM'),
    ...['_phenoStade', '_phenoListe', '_phenoCepages', '_phenoEnSaison', '_phenoJour', '_phenoNorm', '_phenoJourSuiv', '_phenoSerie', '_phenoCumuls', '_phenoCumulAu', '_phenoDateSeuil', '_phenoPrevisions', '_phenoClim', '_phenoJours', '_phenoFmtN', '_phenoCqvHtml'].map((n) => fonction(S.app, 'function ' + n + '('))].join('\n')
    + '\nthis.serie=_phenoSerie; this.cumuls=_phenoCumuls; this.seuil=_phenoDateSeuil; this.prev=_phenoPrevisions; this.clim=_phenoClim; this.jours=_phenoJours; this.html=_phenoCqvHtml;', ctx);
  return ctx;
}
function saison15() { const o = {}; let d = new Date('2026-03-01T12:00:00'); while (d.toISOString().slice(0, 10) <= '2026-10-31') { o[d.toISOString().slice(0, 10)] = 15; d.setDate(d.getDate() + 1); } return o; }
function jouer(S) {
  const C = monde(S, {});
  const ser = C.serie('2026', { '2026-03-01': 10, '2026-03-02': 11 }, { '2026-03-02': 99, '2026-03-03': 12 }, { '03-03': 77, '03-04': 13 });
  t('① les sources dans l’ordre : l’observé, puis la prévision, puis la moyenne des dix ans ; la série s’arrête au premier trou', ser.map((x) => x[1]).join() === '10,11,12,13');
  t('① le cumul : base 0 °C (un jour sous zéro compte pour rien)', C.cumuls([['a', 5], ['b', -3], ['c', 2]]).map((x) => x[1]).join() === '5,5,7');
  const cum = C.cumuls(C.serie('2026', saison15(), {}, {}));
  t('② 15 °C chaque jour : 1 219 °C·j le 21 mai, 2 511 le 15 août', C.seuil(cum, 1219) === '2026-05-21' && C.seuil(cum, 2511) === '2026-08-15');
  const P = C.prev(cum, '2026');
  t('② la prévision par cépage : Pinot noir et Chardonnay (seuils publiés), pas l’Aligoté (aucun seuil retenu) ; le nom écrit de toute façon', P.map((x) => x.cep).join() === 'Pinot noir,Chardonnay' && P[0].flo.d === '2026-05-21' && !P[0].flo.vu && P[1].flo.d === C.seuil(cum, 1217) && P[1].ver.d === C.seuil(cum, 2541));
  const D = monde(S, { pheno: { 2026: [{ pid: 'p1', nom: 'Les Crais', b: 65, d: '2026-05-11' }, { pid: 'p1', nom: 'Les Crais', b: 57, d: '2026-05-01' }] } });
  const Q = D.prev(cum, '2026');
  t('③ une pleine floraison notée le 11 mai (1 080 °C·j) : la floraison « notée », la véraison recalée de −139, au 6 août', Q[0].flo.vu && Q[0].flo.d === '2026-05-11' && Q[0].dec === -139 && Q[0].ver.d === '2026-08-06' && !Q[0].ver.vu && Q[1].ver.d === C.seuil(cum, 2541));
  t('④ la moyenne des dix ans : par jour de l’année ; les jours vides de la réponse ignorés', JSON.stringify(C.clim({ '2024-05-01': 10, '2025-05-01': 14, '2025-05-02': 9 })) === '{"05-01":12,"05-02":9}'
    && JSON.stringify(C.jours({ daily: { time: ['2026-05-01', '2026-05-02'], temperature_2m_mean: [12.5, null] } })) === '{"2026-05-01":12.5}');
  const tObs = Object.fromEntries(Object.entries(saison15()).filter(([d]) => d <= '2026-05-24'));
  const h = C.html({ obs: tObs, prev: {}, clim: { ...Object.fromEntries(Object.entries(saison15()).map(([d, v]) => [d.slice(5), v])) }, anPasse: 1155 }, '2026-05-25');
  t('⑤ la carte complète : le cumul de la veille (85 jours × 15 = 1 275 °C·j), l’écart à l’an dernier (+120), la floraison « vers le 21 mai, à une semaine près », les seuils', h.includes('<b>1\u00a0275\u00a0°C·j</b>') && h.includes('+120 face à l’an dernier à la même date') && h.includes('<b>Pleine floraison, Pinot noir</b><span>vers le 21 mai, à une semaine près</span>') && h.includes('Seuils publiés'));
  t('⑤ hors saison : « Le calcul reprend le 1er mars » ; en lecture ; en panne, la raison', C.html(null, '2026-11-08').includes('Le calcul reprend le 1<sup>er</sup> mars.') && C.html(null, '2026-05-25').includes('Lecture des températures') && C.html({ err: 'Températures indisponibles' }, '2026-05-25').includes('Températures indisponibles'));
  t('⑥ l’appel : l’archive jusqu’à la veille, la prévision (10 jours passés, 16 à venir), dix ans de moyenne ; gardé sur l’appareil, une fois par jour', S.app.includes("'https://archive-api.open-meteo.com/v1/archive?'+ll+'&start_date='+an+'-03-01&end_date='+finObs+'&daily=temperature_2m_mean") && S.app.includes('&daily=temperature_2m_mean&past_days=10&forecast_days=16')
    && S.app.includes("'&start_date='+(Number(an)-10)+'-03-01&end_date='+(Number(an)-1)+'-10-31") && S.app.includes("var cle='mvPhenoT1:'") && S.app.includes('if(C&&C.jour===auj&&C.obs){ cb(C); return; }'));
  t('⑥ la politique de sécurité permet l’hôte de l’archive ; la carte est posée (ordinateur et téléphone) ; la liste joue ce fichier', S.fb.includes('https://api.open-meteo.com https://archive-api.open-meteo.com') && S.app.includes("+'</div>'+_phenoCqvHtml(null,auj)+'</aside></div>';") && S.app.includes("+'</div>'+_phenoCqvHtml(null,auj);") && S.app.includes('  _phenoCqvRemplir();')
    && S.liste.indexOf("mv-harnais-pheno1b.mjs'") > 0 && S.liste.indexOf("mv-harnais-pheno1b.mjs --contre'") > 0);
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
    ['la prévision passe avant l’observé', m('app', "var v=(obs&&obs[d]!=null)?obs[d]:(prev&&prev[d]!=null)?prev[d]:", "var v=(prev&&prev[d]!=null)?prev[d]:(obs&&obs[d]!=null)?obs[d]:")],
    ['les jours sous zéro retranchés', m('app', 'c+=Math.max(0,x[1]);', 'c+=x[1];')],
    ['un seuil faux (Pinot noir 1 291)', m('app', "'pinot noir':[1219,2511]", "'pinot noir':[1291,2511]")],
    ['la véraison n’est plus recalée', m('app', 'ver:{ d:ve||_phenoDateSeuil(cumuls,S[1]+dec)', 'ver:{ d:ve||_phenoDateSeuil(cumuls,S[1])')],
    ['un stade précoce compte pour la floraison', m('app', 'var S=_PHENO_GFV[k], fl=vu(65), ve=vu(81), dec=0;', 'var S=_PHENO_GFV[k], fl=vu(55), ve=vu(81), dec=0;')],
    ['l’hôte de l’archive retiré de la politique de sécurité', m('fb', 'https://api.open-meteo.com https://archive-api.open-meteo.com', 'https://api.open-meteo.com')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-pheno1b.mjs'").join("mv-harnais-phenoZb.mjs'") })],
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
