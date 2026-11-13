/* ───────────────────────────────────────────────────────
   HARNAIS — OBS-1B (§566) : LIRE LES SIGNALEMENTS — LA CARTE, « À SAVOIR », LA CARTE DU JOUR, LE COCKPIT, LE TUTO
   Lancer :          node scripts/mv-harnais-obs1b.mjs
   Contre-épreuves : node scripts/mv-harnais-obs1b.mjs --contre

   POURQUOI IL EXISTE
   Un signalement qu'on ne relit pas ne sert à rien. Ce harnais JOUE les vraies fonctions (extraites d'app.js) : la semaine
   (ouverts, sept jours, rien d'après aujourd'hui), le résumé par type, la bulle de la carte (échappée), le résumé du cockpit ;
   il garde la couche de la carte, la ligne d'« À savoir » (une maladie sur une parcelle sans protection en tête), les parcelles à
   nu lues dans le Pilotage, « Signaler » sur la carte du jour (la parcelle choisie d'abord), le cockpit, le tuto et ses étiquettes.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { app: lire('src/app.js'), pil: lire('src/pilotage.js'), ck: lire('src/cockpit-vue.js'), tu: lire('src/tutos.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function variable(src, nom) { const i = src.indexOf('var ' + nom + '='); if (i < 0) throw new Error('introuvable : ' + nom); return src.slice(i, src.indexOf(';\n', i) + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, O) {
  const ctx = { window: { OBS: O }, todayStr: () => '2026-05-26', _escHtml: (x) => String(x).replace(/</g, '&lt;'), _escAttr: (x) => String(x).replace(/"/g, '&quot;'), _phenoJour: (d) => 'le ' + d };
  vm.createContext(ctx);
  const i = S.app.indexOf('window._obsResumeCockpit=function(){'); const rc = S.app.slice(i, S.app.indexOf('\n};', i) + 3);
  vm.runInContext([variable(S.app, '_OBS_TYPES'), ...['_obsType', '_obsListe', '_obsFamille', '_obsSemaine', '_obsResumeTypes', '_obsBulle'].map((n) => fonction(S.app, 'function ' + n + '('))].join('\n')
    + '\nfunction _obsDemarrer(){}\n' + rc + '\nthis.sem=_obsSemaine; this.res=_obsResumeTypes; this.bulle=_obsBulle; this.fam=_obsFamille; this.ck=window._obsResumeCockpit;', ctx);
  return ctx;
}
function jouer(S) {
  const O = { a: { nom: 'Les Crais', type: 'oidium', int: 'fort', d: '2026-05-25', t: '2026-05-25T09:00:00Z', par: 'Victor', statut: 'ouvert', note: '<b>gros</b>', photo: 'https://x/y.jpg' },
    b: { nom: 'Clos Prieur', type: 'oidium', int: 'moyen', d: '2026-05-20', t: '2026-05-20T09:00:00Z', statut: 'ouvert' }, c: { nom: 'Clos Prieur', type: 'palissage', int: 'faible', d: '2026-05-21', t: '2026-05-21T09:00:00Z', statut: 'ouvert' },
    d: { nom: 'Les Crais', type: 'gel', int: 'fort', d: '2026-05-19', t: '2026-05-19T09:00:00Z', statut: 'ouvert' }, e: { nom: 'Les Crais', type: 'mildiou', int: 'fort', d: '2026-05-24', t: '2026-05-24T09:00:00Z', statut: 'clos' },
    f: { nom: 'Les Crais', type: 'mildiou', int: 'fort', d: '2026-05-27', t: '2026-05-27T09:00:00Z', statut: 'ouvert' } };
  const C = monde(S, O); const s = C.sem('2026-05-26');
  t('① la semaine : les ouverts des sept derniers jours (le 20 compris, pas le 19), ni les clos, ni après aujourd’hui ; les plus récents d’abord', s.map((x) => x.id).join() === 'a,c,b');
  t('① le résumé par type : « 2 oïdium, 1 palissage »', C.res(s) === '2\u00a0oïdium, 1\u00a0palissage');
  const bu = C.bulle(O.a);
  t('② la bulle de la carte : le type, l’intensité, la parcelle, qui, quand, la note échappée, la photo', bu.includes('<b>Oïdium · fort</b>') && bu.includes('Les Crais — Victor, le 2026-05-25') && bu.includes('&lt;b>gros&lt;/b>') && bu.includes('href="https://x/y.jpg"'));
  t('② les familles (les couleurs de la carte) : oïdium → maladie, gel → gel, palissage → palissage', C.fam('oidium') === 'maladie' && C.fam('gel') === 'gel' && C.fam('palissage') === 'palissage');
  const r = C.ck();
  t('③ le cockpit : 3 ouverts, par type, les trois derniers ; rien sans signalement', r && r.n === 3 && r.types === '2\u00a0oïdium, 1\u00a0palissage' && r.derniers.length === 3 && r.derniers[0].lib === 'Oïdium · fort' && monde(S, {}).ck() === null);
  t('④ la carte : une épingle par signalement de la semaine qui a un point GPS, la bulle', S.app.includes('_obsSemaine(todayStr()).forEach(function(e){') && S.app.includes('L.marker([la,ln],{icon:ic,zIndexOffset:500,title:(_obsType(e.type)||[0,\'\'])[1]}).addTo(leafMap).bindPopup(_obsBulle(e));'));
  t('④ « À savoir » : une maladie sur une parcelle sans protection en tête (les parcelles à nu lues dans le Pilotage) ; les autres en une ligne', S.app.includes("var _mn=_nu?_os.filter(function(e){ return _obsFamille(e.type)==='maladie'&&_nu.indexOf(e.nom)>=0; }):[];") && S.app.includes("if(_mn.length){ var _e0=_mn[0]; out.unshift({t:'dan',")
    && S.pil.includes('return (P&&P.rows||[]).filter(function(r){ return r.jamais||r.lessive||(r.reste!=null&&r.reste<=0); }).map(function(r){ return r.nom; });'));
  t('⑤ la carte du jour : « Signaler » (s’il existe) ; sans parcelle, le choix de la parcelle d’abord', S.app.includes("+pq)+(typeof _obsBtnJour==='function'?_obsBtnJour():'')+'</div>';") && S.app.includes('if(!nom){ _obsDemarrer(); _obsChoixParcelle(); return; }'));
  t('⑤ le cockpit : la section, cachée sans signalement, « Carte »', S.ck.includes('id="ck-obs" aria-label="Signalements de la semaine" hidden') && S.ck.includes('so.innerHTML = ho; so.hidden = !ho;') && S.ck.includes("fn.dataset.fn === 'obscarte'"));
  t('⑥ le tuto « signaler » : la fiche, « Signaler », un type, Enregistrer ; ses étiquettes en toutes lettres dans l’appli ; la liste joue ce fichier', /\{ id: 'signaler', titre: 'Comment faire pour signaler/.test(S.tu) && ['dp.obs', 'obs.type', 'obs.ok', 'dp.obs.v'].every((e) => S.app.includes('data-tuto="' + e + '"'))
    && S.liste.indexOf("mv-harnais-obs1b.mjs'") > 0 && S.liste.indexOf("mv-harnais-obs1b.mjs --contre'") > 0);
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
    ['la semaine sur huit jours', m('app', 'd0.setDate(d0.getDate()-6);', 'd0.setDate(d0.getDate()-7);')],
    ['les clos dans la semaine', m('app', "return _obsListe().filter(function(e){ return e.statut==='ouvert'&&", 'return _obsListe().filter(function(e){ return true&&')],
    ['la note non échappée dans la bulle', m('app', "+(e.note?'<br>'+_escHtml(e.note):'')+ph;", "+(e.note?'<br>'+e.note:'')+ph;")],
    ['la maladie à nu ne passe plus en tête', m('app', "if(_mn.length){ var _e0=_mn[0]; out.unshift({t:'dan',", "if(_mn.length){ var _e0=_mn[0]; out.push({t:'dan',")],
    ['une parcelle protégée comptée à nu', m('pil', 'r.jamais||r.lessive||(r.reste!=null&&r.reste<=0)', 'r.jamais||r.lessive||(r.reste!=null)')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-obs1b.mjs'").join("mv-harnais-obsZb.mjs'") })],
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
