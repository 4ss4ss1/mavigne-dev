/* ───────────────────────────────────────────────────────
   HARNAIS — RECOLTE-1B (§569) : LE VOLET « PRÉVU » DES RÉCOLTES, LES RÉGLAGES DU CALCUL, LE RECALAGE, LE TUTO
   Lancer :          node scripts/mv-harnais-rct1b.mjs
   Contre-épreuves : node scripts/mv-harnais-rct1b.mjs --contre

   POURQUOI IL EXISTE
   Ce harnais JOUE _rctPrevu et _rctReglage (extraites d'app.js) : la parcelle non comptée prend la moyenne des parcelles comptées
   de son cépage (et le dit), le maximum de l'appellation (celui des Récoltes) alerte au-dessus, une maladie signalée dit « poids à
   revoir », le total du domaine ; à la vendange, le réel face au prévu propose le poids qui l'aurait donné ; les réglages (bornés,
   l'administrateur seul). Il garde la bascule « Réel · Prévu », le bouton toute l'année, le tuto et ses étiquettes, et les champs
   stylés (la classe `phn-date`, posée par OBS-1A et RECOLTE-1A, n'existait dans aucune feuille).
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { app: lire('src/app.js'), cuv: lire('src/cuvier.js'), tu: lire('src/tutos.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function variable(src, nom) { const m = new RegExp('var ' + nom + '\\s*=').exec(src); if (!m) throw new Error('introuvable : ' + nom); return src.slice(m.index, src.indexOf(';', m.index) + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, o) {
  const P = [{ nom: 'Les Crais', pid: 'p1', cepage: 'Pinot noir', surface: '0.5' }, { nom: 'Clos Prieur', pid: 'p3', cepage: 'Pinot noir', surface: '1.0' }, { nom: 'Aux Combottes', pid: 'p2', cepage: 'Pinot noir', surface: '1.0' }];
  let saves = 0; const R = { 2026: { p1: { g: [5, 5], d: '2026-07-10' }, p3: { g: [7, 7], d: '2026-07-10' } } };
  const ctx = { window: { PARCELLES: P, RECOLTE: R, CONFIG: o.config || {}, _mvVigne: () => ({ ec_rang: 1, ec_pied: 1, pieds: 10000 }), _cptReste: () => 0,
      _vendRdtMax: (p) => ({ max: p.nom === 'Clos Prieur' ? 50 : 60 }), _mlRendements: () => (o.reel || []) }, isAdmin: () => o.adm !== false, saveData: () => { saves++; }, todayStr: () => '2026-07-17',
    _phenoCuvees: () => ({ 'Les Crais': 'Gevrey village', 'Clos Prieur': 'Gevrey village' }), _obsListe: (n) => (n === 'Aux Combottes' ? [{ statut: 'ouvert', type: 'oidium', d: '2026-07-12' }] : []), _obsFamille: (k) => (k === 'oidium' ? 'maladie' : 'autre') };
  vm.createContext(ctx);
  vm.runInContext([variable(S.app, '_RCT_POIDS_DEF'), variable(S.app, '_RCT_BLANCS'), 'var _RCT_POIDS_AUTRE=120;',
    ...['_phenoAdm', '_phenoCepages', '_phenoNorm', '_rctCfg', '_rctCep', '_rctBlanc', '_rctPoids', '_rctPieds', '_rctMoy', '_rctAn', '_rctDernier', '_rctPrevu', '_rctReglage'].map((n) => fonction(S.app, 'function ' + n + '('))].join('\n')
    + '\nfunction renderVendRec(){}\nthis.prevu=_rctPrevu; this.reg=_rctReglage;', ctx);
  return { ctx, saves: () => saves };
}
function jouer(S) {
  const A = monde(S, {}); const V = A.ctx.prevu('2026'); const x = (n) => V.L.find((e) => e.p.nom === n);
  t('① comptées : Les Crais 5 grappes, Clos Prieur 7 ; non comptée, Aux Combottes prend la moyenne du Pinot noir (6), et le dit', x('Les Crais').gp === 5 && x('Clos Prieur').gp === 7 && x('Aux Combottes').gp === 6 && x('Aux Combottes').compte === false && x('Les Crais').compte === true);
  t('① le calcul : Clos Prieur 10 000 pieds × 7 × 118 g = 8 260 kg, 57,8 hL, 57,8 hL/ha', x('Clos Prieur').kg === 8260 && x('Clos Prieur').hl === 57.8 && x('Clos Prieur').hlha === 57.8);
  t('② le maximum de l’appellation (celui des Récoltes) : Clos Prieur au-dessus de 50 hL/ha ; Les Crais (41,4) dessous', x('Clos Prieur').max === 50 && x('Clos Prieur').depasse && !x('Les Crais').depasse);
  t('② une maladie signalée sur la parcelle : « poids à revoir »', x('Aux Combottes').maladie && !x('Les Crais').maladie);
  t('③ rangé par cuvée ; le total du domaine (20,7 + 57,8 + 49,6 = 128,1 hL sur 2,5 ha, 51,2 hL/ha)', x('Les Crais').cuvee === 'Gevrey village' && x('Aux Combottes').cuvee === '' && x('Les Crais').hl === 20.7 && V.hl === 128.1 && V.hlha === 51.2);
  const B = monde(S, { reel: [{ parcelle: { nom: 'Les Crais' }, kg: 3245 }, { parcelle: { nom: 'Clos Prieur' }, kg: 9086 }] }).ctx.prevu('2026');
  t('④ le recalage : le réel (12 331 kg) face au prévu (11 210) sur les parcelles comptées et vendangées → Pinot noir 118 → 130 g', B.recal.length === 1 && B.recal[0].de === 118 && B.recal[0].vers === 130 && B.recal[0].ecart === 10);
  const C = monde(S, { config: {} }); C.ctx.reg('poids', 'pinot noir', '124'); C.ctx.reg('lkg_blanc', '', '0,76'); C.ctx.reg('poids', 'pinot noir', '9000'); C.ctx.reg('lkg_rouge', '', '2');
  const D = monde(S, { adm: false, config: {} }); D.ctx.reg('poids', 'pinot noir', '124');
  t('⑤ les réglages : 124 g, 0,76 L/kg ; hors bornes ignorés ; pas sans être administrateur', C.ctx.window.CONFIG.recolte.poids['pinot noir'] === 124 && C.ctx.window.CONFIG.recolte.lkg_blanc === 0.76 && !('lkg_rouge' in C.ctx.window.CONFIG.recolte) && C.saves() === 2 && !D.ctx.window.CONFIG.recolte && D.saves() === 0);
  t('⑥ les Récoltes : la bascule « Réel · Prévu » (lue seulement si elle existe), le volet Prévu avant toute pesée', S.cuv.includes("var _rm = (typeof _recMode !== 'undefined') ? _recMode : 'reel';") && S.cuv.includes("if(_rm === 'prevu'){ h += (typeof window._rctPrevuHtml === 'function') ? window._rctPrevuHtml(D.an) : '';") && S.cuv.includes('window._recSetMode          = _recSetMode;'));
  t('⑦ le bouton toute l’année pour l’administrateur ; le tuto « grappes » et ses étiquettes ; la liste joue ce fichier', S.app.includes('var der=_rctDernier(p), adm=_phenoAdm(), saison=adm;') && /\{ id: 'grappes', titre: 'Comment faire pour compter les grappes/.test(S.tu) && ['dp.rct', 'rct.pied', 'rct.ok', 'dp.rct.v'].every((e) => S.app.includes('data-tuto="' + e + '"'))
    && S.liste.indexOf("mv-harnais-rct1b.mjs'") > 0 && S.liste.indexOf("mv-harnais-rct1b.mjs --contre'") > 0);
  t('⑧ les champs ont un style : plus aucune classe `phn-date` (sans règle), le champ de l’appli et son libellé (comptage, « Signaler », réglages)', S.app.indexOf('class="phn-date"') < 0 && ['class="mvchamp" aria-label="Photo"', 'class="mvchamp" id="obs-note" aria-label="Note"', 'class="mvchamp" aria-label="Pied \'+(i+1)+\'"', 'class="mvchamp" aria-label="\'+_escAttr(lib)+\'"'].every((x) => S.app.includes(x)));
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
    ['la parcelle non comptée sans moyenne du cépage', m('app', 'gp=M?M.m:moyCep(cep)', 'gp=M?M.m:null')],
    ['le maximum ignoré', m('app', 'depasse:!!(max&&hlha&&hlha>max)', 'depasse:false')],
    ['la maladie oubliée', m('app', "return e.statut==='ouvert'&&_obsFamille(e.type)==='maladie'&&", "return false&&")],
    ['le recalage à l’envers', m('app', 'n=Math.round(g*r.reel/r.prevu)', 'n=Math.round(g*r.prevu/r.reel)')],
    ['les réglages sans borne', m('app', "if(!(n>=20&&n<=600)) return;", '')],
    ['le volet Prévu ne s’affiche plus', m('cuv', "if(_rm === 'prevu'){ h +=", "if(false){ h +=")],
    ['un champ sans style revient', m('app', '<p class="phn-etq">Note</p><input type="text" class="mvchamp"', '<span>Note</span><input type="text" class="phn-date"')],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-rct1b.mjs'").join("mv-harnais-rctZb.mjs'") })],
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
