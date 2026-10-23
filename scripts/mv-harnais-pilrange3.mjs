/* ───────────────────────────────────────────────────────
   HARNAIS — PIL-RANGE-3 (§445) : « LA CAMPAGNE » DEVIENT « TRAVAUX » ; LA JAUGE OUVRE « AVANCEMENT PAR TÂCHE » ;
   « LA CHARGE PAR TÂCHE »
   Lancer :          node scripts/mv-harnais-pilrange3.mjs
   Contre-épreuves : node scripts/mv-harnais-pilrange3.mjs --contre

   POURQUOI IL EXISTE
   Le rangement prévoyait de fusionner le donut et « Le temps de l'équipe » : vérifié sur le code, ils répondent à deux
   questions (la charge par tâche ; où passent les heures de présence). Version corrigée validée par Nico (« go », 23/10) :
   l'onglet s'appelle « Travaux » (la barre dit déjà « La campagne »), la jauge de saison n'est plus une carte et ouvre
   « Avancement par tâche » (mêmes chiffres), le donut s'appelle « La charge par tâche ». Ce harnais EXÉCUTE _pilTabAvc et
   le calcul du donut (_PIEFN_), et lit le reste sur le texte.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), coq: lire('src/coquille.js'), app: lire('src/app.js'), vue: lire('src/cockpit-vue.js'), utils: lire('src/utils.js'), guide: lire('guide/11-pilotage.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
function corps(src, nom) { const i = src.indexOf('function ' + nom + '('); if (i < 0) throw new Error('fonction absente : ' + nom); const j = src.indexOf('{', i); let p = 0, k = j; for (; k < src.length; k++) { const c = src[k]; if (c === '{') p++; else if (c === '}' && --p === 0) break; } return src.slice(i, k + 1); }
const pieFn = (P) => { const i = P.indexOf("title='La charge par t"); if (i < 0) throw new Error('titres du donut absents'); const m = [...P.slice(0, i).matchAll(/\nfunction\s+([\w$]+)\s*\(/g)]; return m[m.length - 1][1]; };
let ok = 0, ko = 0;
const t = (nom, cond, det) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom + (det ? '\n      → ' + det : '')); } };
function jouer(S) {
  const P = S.pil;
  const avc = (show) => { const c = { _pilShow: (k) => !!show[k], _pilPanelTemps: () => '<i>TEMPS</i>', _pilPanelEcheances: () => '<i>ECH</i>', _pilPanelCarte: () => '<i>CARTE</i>' };
    vm.createContext(c); vm.runInContext(corps(P, '_pilTabAvc'), c); return c._pilTabAvc({ data: [] }); };
  const tout = { avc_gauge: 1, avc_bar: 1, avc_pie: 1, avc_temps: 1, avc_echeances: 1, avc_carte: 1 };
  const h = avc(tout);
  t('① la jauge n’est plus une carte en tête : elle ouvre « Avancement par tâche », avant les barres', !/^<div class="pil-gauge"/.test(h) && /Avancement par tâche<\/div>[\s\S]*?<div class="pil-gauge pil-gauge-in" id="pil-gauge"><\/div><div class="pil-bar" id="pil-bar">/.test(h), h.slice(0, 160));
  t('① une seule jauge à l’écran', (h.match(/id="pil-gauge"/g) || []).length === 1);
  t('① « Avancement par tâche » décoché : pas de jauge non plus', !/pil-gauge/.test(avc(Object.assign({}, tout, { avc_bar: 0 }))));
  t('① le donut s’ouvre sur « La charge par tâche · restante », « Le temps de l’équipe » reste à part', /id="pil-pie-title">La charge par tâche · restante</.test(h) && /<i>TEMPS<\/i>/.test(h));
  const fn = pieFn(P), modes = {};
  for (const m of ['reste', 'fait', 'plan']) { const c = { _PIL_STATE: { pie: m }, Math, _PIL_PIE_COLORS: ['#111', '#222', '#333', '#444', '#555', '#666', '#777', '#888'] }; vm.createContext(c); vm.runInContext(corps(P, fn), c); try { const r = c[fn]({ data: [{ nom: 'Taille', h_reste: 10, h_done: 5, h_total: 15 }] }); modes[m] = r && r.title; } catch (e) { modes[m] = 'PLANTE ' + e.message; } }
  t('② les trois modes du donut gardent le même nom : restante, réalisée, planifiée', modes.reste === 'La charge par tâche · restante' && modes.fait === 'La charge par tâche · réalisée' && modes.plan === 'La charge par tâche · planifiée', JSON.stringify(modes));
  t('③ la jauge se dessine sous la case « Avancement par tâche »', /if\(_pilShow\('avc_bar'\)\) _pilRenderGauge\(d\);/.test(P) && !/_pilShow\('avc_gauge'\)/.test(P));
  t('③ dans la carte, la jauge perd son cadre (pas une carte dans la carte)', P.includes("+'.pil-panel .pil-gauge-in{background:none;border:0;"));
  t('③ « Afficher dans cet onglet » : plus de « Jauge de saison », le donut s’appelle « La charge par tâche »', /avc:\[\['avc_bar','Avancement par tâche \(et la saison\)'\],\['avc_pie','La charge par tâche'\],/.test(P) && !/Jauge de saison/.test(P));
  t('④ l’onglet s’appelle « Travaux » : menu, intitulé, barre latérale, recherche, cockpit', /\['avc','raisin','Travaux'\]/.test(P) && /avc:'Travaux — /.test(P) && /\['avc', 'Travaux'\]/.test(S.coq) && /id:'campagne', ic:'raisin', t:'Travaux'/.test(S.app) && /'camp', 'Travaux'\)/.test(S.vue));
  t('④ la barre « Vous regardez » garde « La campagne » (ce qu’on regarde, pas l’onglet)', /B\('camp','La campagne'\)/.test(P));
  t('④ l’aide et le guide disent « Travaux », et la différence donut / temps de l’équipe', S.utils.includes("['Travaux', \"(l’ancien « La campagne ») montre") && /Aujourd'hui · Travaux ·/.test(S.guide) && /<b>La charge par tâche<\/b> \(le donut\)/.test(S.guide));
  t('⑤ la liste des harnais joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-pilrange3.mjs'") > 0 && S.liste.indexOf("mv-harnais-pilrange3.mjs --contre'") > 0);
}
if (!CONTRE) {
  try { jouer(S0); } catch (e) { ko++; console.log('  \x1b[31m✗\x1b[0m plantage : ' + (e && e.stack || e)); }
  console.log('\n' + (ko ? '\x1b[31mROUGE\x1b[0m' : '\x1b[32mVERT\x1b[0m') + ' — ' + ok + ' assertions, ' + ko + ' échec(s)');
  process.exit(ko ? 1 : 0);
} else {
  const R = (S, k, a, b) => { if (S[k].split(a).length !== 2) throw new Error('ancre : ' + a.slice(0, 50)); return Object.assign({}, S, { [k]: S[k].split(a).join(b) }); };
  const mutants = [
    ['la jauge redevient une carte en tête', (S) => R(S, 'pil', "  var charts='';", "  H+='<div class=\"pil-gauge\" id=\"pil-gauge\"></div>';\n  var charts='';")],
    ['la jauge sort de la carte', (S) => R(S, 'pil', '<div class="pil-gauge pil-gauge-in" id="pil-gauge"></div><div class="pil-bar"', '<div class="pil-bar"')],
    ['le donut reprend son ancien nom', (S) => R(S, 'pil', 'id="pil-pie-title">La charge par tâche · restante<', 'id="pil-pie-title">Charge restante<')],
    ['un mode du donut change de nom', (S) => R(S, 'pil', "title='La charge par tâche · planifiée'", "title='Charge planifiée'")],
    ['la jauge ne se dessine plus', (S) => R(S, 'pil', "if(_pilShow('avc_bar')) _pilRenderGauge(d);", '')],
    ['l’onglet redevient « La campagne »', (S) => R(S, 'pil', "['avc','raisin','Travaux']", "['avc','raisin','La campagne']")],
    ['la barre latérale dit encore « La campagne »', (S) => R(S, 'coq', "['avc', 'Travaux']", "['avc', 'La campagne']")],
    ['la carte dans la carte revient', (S) => R(S, 'pil', "+'.pil-panel .pil-gauge-in{background:none;border:0;", "+'.pil-panel .pil-gauge-x{background:none;border:0;")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-pilrange3.mjs'").join("mv-harnais-pilrangeZ.mjs'") })],
  ];
  let bons = 0;
  for (const [nom, mut] of mutants) {
    let S; try { S = mut(S0); } catch (e) { console.log('  \x1b[31m✗\x1b[0m non injecté (' + e.message + ') : ' + nom); continue; }
    ok = 0; ko = 0; const log = console.log; console.log = () => {};
    try { jouer(S); } catch (e) { ko++; }
    console.log = log;
    if (ko > 0) { bons++; console.log('  \x1b[32m✓\x1b[0m rougit : ' + nom + ' (' + ko + ')'); } else console.log('  \x1b[31m✗\x1b[0m NE ROUGIT PAS : ' + nom);
  }
  console.log('\n' + (bons === mutants.length ? '\x1b[32mVERT\x1b[0m' : '\x1b[31mROUGE\x1b[0m') + ' — ' + bons + '/' + mutants.length + ' contre-épreuves mordent');
  process.exit(bons === mutants.length ? 0 : 1);
}
