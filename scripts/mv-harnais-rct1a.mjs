/* ───────────────────────────────────────────────────────
   HARNAIS — RECOLTE-1A (§568) : COMPTER LES GRAPPES — DIX PIEDS, LES PIEDS PRÉSENTS, LE POIDS, LES HECTOLITRES PRÉVUS
   Lancer :          node scripts/mv-harnais-rct1a.mjs
   Contre-épreuves : node scripts/mv-harnais-rct1a.mjs --contre

   POURQUOI IL EXISTE
   Une récolte prévue fausse d'un tiers fait commander les mauvaises cuves. Ce harnais JOUE les vraies fonctions (extraites
   d'app.js) sur l'exemple de la maquette : Chazière haut, 1 × 1 m (10 000 pieds/ha), 0,55 ha, 190 manquants → 5 310 pieds ;
   9 pieds comptés, 5,2 grappes ; Pinot noir 118 g ; 0,70 L/kg → 22,8 hL. Il garde le blanc à 0,75, les réglages qui remplacent les
   défauts, l'enregistrement (l'administrateur seul, une entrée par parcelle et par année), le document `recolte` et sa règle.
   ─────────────────────────────────────────────────────── */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { app: lire('src/app.js'), fb: lire('src/firebase.js'), rules: lire('firestore.rules'), html: lire('index.html'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function variable(src, nom) { const m = new RegExp('var ' + nom + '\\s*=').exec(src); if (!m) throw new Error('introuvable : ' + nom); return src.slice(m.index, src.indexOf(';', m.index) + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, o) {
  let saves = 0; const toasts = [];
  const ctx = { window: { CONFIG: { recolte: o.recolte || {} }, RECOLTE: o.R || {}, PARCELLES: o.P || [], currentUser: { nom: 'Nico' }, _mvVigne: () => (o.vigne === null ? null : (o.vigne || { ec_rang: 1, ec_pied: 1, pieds: 10000 })), _cptReste: (p) => (p.manq || 0), showToast: (m) => toasts.push(m) },
    isAdmin: () => o.adm !== false, todayStr: () => '2026-07-17', saveData: () => { saves++; }, closeOv() {}, showToast: (m) => toasts.push(m), _escHtml: (x) => String(x), _escAttr: (x) => String(x), _phenoJour: (d) => 'le ' + d, _phenoP: null };
  vm.createContext(ctx);
  vm.runInContext(['var _rctP=null, _rctG=null;', variable(S.app, '_RCT_POIDS_DEF'), variable(S.app, '_RCT_BLANCS'),
    ...['_phenoAdm', '_phenoCepages', '_phenoNorm', '_rctCfg', '_rctCep', '_rctBlanc', '_rctPoids', '_rctPieds', '_rctMoy', '_rctHl', '_rctAn', '_rctDernier', '_rctFmt', '_rctEnregistrer'].map((n) => fonction(S.app, 'function ' + n + '('))].join('\n')
    + '\nvar _RCT_POIDS_AUTRE=120; function _rctRafraichir(){}\nthis.hl=_rctHl; this.pieds=_rctPieds; this.moy=_rctMoy; this.poids=_rctPoids; this.set=function(p,g){ _rctP=p; _rctG=g; }; this.enr=_rctEnregistrer; this.der=_rctDernier;', ctx);
  return { ctx, saves: () => saves, toasts };
}
function jouer(S) {
  const chaz = { nom: 'Chazière haut', pid: 'p7', cepage: 'Pinot noir', surface: '0.55', manq: 190 };
  const C = monde(S, {}), g = [5, 6, 4, 6, 5, 5, 6, 4, 6, null];
  t('① la maquette : 1 × 1 m → 10 000 pieds/ha × 0,55 ha − 190 manquants = 5 310 pieds', C.ctx.pieds(chaz).n === 5310 && C.ctx.pieds(chaz).ec === '1 × 1 m');
  t('① la moyenne sur les pieds comptés (9, le 10e vide) : 5,2 grappes', C.ctx.moy(g).n === 9 && C.ctx.moy(g).m === 5.2);
  const h = C.ctx.hl(chaz, g);
  t('② Pinot noir 118 g, 0,70 L/kg : 3 258 kg, 22,8 hL (la maquette arrondit à 23), 41,5 hL/ha', h && h.kg === 3258 && h.hl === 22.8 && h.lkg === 0.7 && h.hlha === 41.5);
  const blanc = { nom: 'Champerrier', pid: 'p5', cepage: 'Chardonnay', surface: '0.50' };
  t('② le blanc : Chardonnay 142 g, 0,75 L/kg', C.ctx.poids('Chardonnay') === 142 && C.ctx.hl(blanc, [6, 6]).lkg === 0.75 && C.ctx.poids('Gamay') === 120);
  const D = monde(S, { recolte: { poids: { 'pinot noir': 130 }, lkg_rouge: 0.72, lkg_blanc: 2 } });
  t('③ les réglages remplacent les défauts (130 g, 0,72 L/kg) ; un rendement hors bornes est ignoré (blanc : 0,75)', D.ctx.poids('Pinot noir') === 130 && D.ctx.hl(chaz, g).lkg === 0.72 && D.ctx.hl(blanc, [6]).lkg === 0.75);
  t('③ sans écartements réglés : pas de pieds, pas d’hectolitres (rien d’inventé)', monde(S, { vigne: null }).ctx.hl(chaz, g) === null);
  const E = monde(S, { P: [chaz] }); E.ctx.set(chaz, g); E.ctx.enr();
  const e = E.ctx.window.RECOLTE['2026'] && E.ctx.window.RECOLTE['2026'].p7;
  t('④ enregistrer : une entrée par parcelle (son identifiant) et par année, les dix comptes, la date, l’auteur', e && e.nom === 'Chazière haut' && e.g.length === 10 && e.g[9] === null && e.d === '2026-07-17' && e.par === 'Nico' && E.saves() === 1 && /22,8 hL prévus/.test(E.toasts[0]));
  const F = monde(S, { adm: false, P: [chaz] }); F.ctx.set(chaz, g); F.ctx.enr();
  const G = monde(S, { P: [chaz] }); G.ctx.set(chaz, [null, null]); G.ctx.enr();
  t('④ pas sans être administrateur ; pas sans un seul compte', !F.ctx.window.RECOLTE['2026'] && F.saves() === 0 && !G.ctx.window.RECOLTE['2026'] && G.saves() === 0);
  t('⑤ le document `recolte` : déclaré, en temps réel, nommé, pesé, connu de saveData ; la règle le réserve à l’administrateur', S.fb.includes("  'recolte',\n") && S.fb.includes("'intrants','pheno','recolte'];") && S.fb.includes("recolte:'La récolte prévue'") && S.fb.includes('recolte: 2,')
    && S.app.includes('recolte:            window.RECOLTE || (window.RECOLTE={}),') && /'pheno',\s*\/\/ ★ PHENO-1A \(§505\)\n\s*'recolte'\];/.test(S.rules));
  t('⑥ l’écran : la place dans la fiche, la fiche du téléphone et celle de l’ordinateur branchées ; la liste joue ce fichier', S.html.includes('id="dp-rct"') && S.app.includes('_rctFiche(p);   // ★ RECOLTE-1A') && S.app.includes("var _rcH=(typeof _rctFicheHtml==='function')?_rctFicheHtml(p):'';")
    && S.liste.indexOf("mv-harnais-rct1a.mjs'") > 0 && S.liste.indexOf("mv-harnais-rct1a.mjs --contre'") > 0);
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
    ['les manquants oubliés', m('app', 'n:Math.max(0,Math.round(v.pieds*s)-m)', 'n:Math.max(0,Math.round(v.pieds*s))')],
    ['la moyenne sur dix pieds, vides compris', m('app', "var L=(g||[]).filter(function(x){ return x!=null&&x!==''&&isFinite(Number(x))&&Number(x)>=0; }).map(Number);", 'var L=(g||[]).map(Number);')],
    ['le blanc à 0,70', m('app', 'lkgB:(b>0&&b<=1)?b:0.75', 'lkgB:(b>0&&b<=1)?b:0.70')],
    ['un poids de Pinot noir faux', m('app', "var _RCT_POIDS_DEF={ 'pinot noir':118,", "var _RCT_POIDS_DEF={ 'pinot noir':181,")],
    ['enregistrer ouvert à tous', m('app', "  if(!_phenoAdm()||!_rctP||!_rctMoy(_rctG)) {", "  if(!_rctP||!_rctMoy(_rctG)) {")],
    ['la règle ne réserve plus `recolte`', m('rules', "                   'recolte'];", "                   ];")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-rct1a.mjs'").join("mv-harnais-rctZa.mjs'") })],
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
