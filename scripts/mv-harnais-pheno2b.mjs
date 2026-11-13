/* ───────────────────────────────────────────────────────
   HARNAIS — PHENO-2B (§564) : LA POUSSE RACCOURCIT UN CONTACT ; LES PARCELLES EN FLEUR N'ONT QUE LE CRÉNEAU DU SOIR
   Lancer :          node scripts/mv-harnais-pheno2b.mjs
   Contre-épreuves : node scripts/mv-harnais-pheno2b.mjs --contre

   POURQUOI IL EXISTE
   Les deux derniers branchements du plan PHENO-2. Ce harnais JOUE les vraies fonctions (extraites de pilotage.js) : le coucher
   du soleil (NOAA) à Gevrey le 26 mai 2026 — 21 h 22, la valeur que porte la maquette — et le créneau du soir qui en découle
   (19 h 22 – 0 h 22) pour les parcelles en fleur (stades 61 à 69 seulement) ; la protection restante d'un contact lue par la
   pousse (stades 16 à 79 : 10 jours deviennent 7, le coefficient réglé), pas d'un systémique, pas hors de la pousse, pas sans
   stade. Il garde le réglage (borné), la ligne de la tuile et celle du cockpit.
   ─────────────────────────────────────────────────────── */
process.env.TZ = 'Europe/Paris';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTRE = process.argv.includes('--contre');
const lire = (f) => fs.readFileSync(path.join(RACINE, f), 'utf8');
const S0 = { pil: lire('src/pilotage.js'), ck: lire('src/cockpit-vue.js'), rg: lire('src/reglages.js'), liste: lire('scripts/mv-harnais-liste.mjs') };
function fonction(src, debut) { const i = src.indexOf(debut); if (i < 0) throw new Error('introuvable : ' + debut); let k = src.indexOf('{', i), p = 0; for (; k < src.length; k++) { if (src[k] === '{') p++; else if (src[k] === '}' && --p === 0) break; } return src.slice(i, k + 1); }
function variable(src, nom) { const i = src.indexOf('var ' + nom + '='); if (i < 0) throw new Error('introuvable : ' + nom); return src.slice(i, src.indexOf(';\n', i) + 1); }
let ok = 0, ko = 0;
const t = (nom, cond) => { if (cond) { ok++; console.log('  \x1b[32m✓\x1b[0m ' + nom); } else { ko++; console.log('  \x1b[31m✗\x1b[0m ' + nom); } };
function monde(S, o) {
  const P = [{ nom: 'Les Crais', surface: '0.5' }, { nom: 'Clos Prieur', surface: '1.2' }, { nom: 'Aux Combottes', surface: '1.6' }, { nom: 'En Champs', surface: '0.7' }];
  const B = o.stades || {};
  const ctx = { window: { PARCELLES: P, TRAITEMENTS: o.trt || [], CONFIG: { conformite: o.conf || {} }, METEO_PLUIE: null, _phenoStadeAu: (p) => (p.nom in B ? B[p.nom] : null) },
    getDomaineGeo: () => ({ lat: 47.2257, lng: 4.9670 }), Date };
  vm.createContext(ctx);
  vm.runInContext([variable(S.pil, '_PIL_PROT_DEF'), variable(S.pil, '_PIL_PROT_LESS_DEF'), variable(S.pil, '_PIL_PROT_POUSSE_DEF'), 'var _PIL_PROT_RX=[];',
    'function _pilPhotoIso(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }',
    'function _pilProtType(p){ return { mode: (p&&p.mode)||"contact", deduit:false }; }', 'function _pilProtPluie(){ return null; }',
    ...['_pilCoucher', '_pilHm', '_pilSoirFleurs', '_pilProtCfg', '_pilProtData'].map((n) => fonction(S.pil, 'function ' + n + '('))].join('\n')
    + '\nthis.coucher=_pilCoucher; this.soir=_pilSoirFleurs; this.data=_pilProtData; this.cfg=_pilProtCfg;', ctx);
  return ctx;
}
const hm = (m) => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
function jouer(S) {
  const C = monde(S, { stades: { 'Les Crais': 61, 'Aux Combottes': 65, 'Clos Prieur': 71, 'En Champs': 57 } });
  const c = C.coucher('2026-05-26', 47.2257, 4.9670);
  t('① le coucher du soleil (NOAA) à Gevrey, le 26 mai 2026 : 21 h 22 (la maquette), à une minute près — ' + hm(c), Math.abs(c - (21 * 60 + 22)) <= 1);
  const c2 = C.coucher('2026-12-21', 47.2257, 4.9670);
  t('① au solstice d’hiver : 16 h 52 (heure d’hiver, la NOAA le donne à 16 h 52 min 32 s), à une minute près — ' + hm(c2), Math.abs(c2 - (16 * 60 + 52)) <= 1);
  const s = C.soir('2026-05-26');
  t('② le créneau du soir : les parcelles en fleur (61, 65 — pas la nouaison, pas les boutons), 2 h avant et 3 h après le coucher', s && s.n === 2 && s.noms.join() === 'Les Crais,Aux Combottes' && s.coucher === '21\u00a0h\u00a022' && s.debut === '19\u00a0h\u00a022' && s.fin === '0\u00a0h\u00a022');
  t('② sans parcelle en fleur : rien', monde(S, { stades: { 'Les Crais': 57 } }).soir('2026-05-26') === null);
  const auj = new Date(); const iso = (n) => { const d = new Date(auj); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  const trt = [{ date: iso(8), parcelles: ['En Champs', 'Les Crais', 'Clos Prieur'], produits: [{ mode: 'contact' }] }, { date: iso(8), parcelles: ['Aux Combottes'], produits: [{ mode: 'systemique' }] }];
  const D = monde(S, { trt, stades: { 'En Champs': 57, 'Les Crais': 81, 'Aux Combottes': 57 } }).data();
  const r = (n) => D.rows.find((x) => x.nom === n);
  t('③ la pousse : un contact au stade 57 couvre 7 jours, pas 10 (traité il y a 8 jours : à nu) ; à la véraison (81), 10 ; sans stade, 10', r('En Champs').rem === 7 && r('En Champs').pousse && r('En Champs').reste === -1 && r('Les Crais').rem === 10 && !r('Les Crais').pousse && r('Clos Prieur').rem === 10 && D.nPousse === 1);
  t('③ un systémique n’est pas raccourci, même en pleine pousse', r('Aux Combottes').rem === 14 && !r('Aux Combottes').pousse);
  t('④ le coefficient réglé (0,6 → 6 jours) ; hors des bornes (1,5), 0,7', monde(S, { conf: { prot_pousse_coef: 0.6 } }).cfg().pousse === 0.6 && monde(S, { conf: { prot_pousse_coef: 1.5 } }).cfg().pousse === 0.7
    && S.rg.includes("else if(key==='pousse'){ var _pc=_ecoNum(val); C.conformite.prot_pousse_coef=(_pc>=0.3&&_pc<=1)?_pc:0.7; }") && S.rg.includes("['pousse','Pousse d\\u2019un contact',"));
  t('⑤ la tuile « Traiter ? » et le cockpit disent le créneau du soir ; la protection dit la pousse et « en fleur → le soir »', S.pil.includes("ban+='<div class=\"pil-t2s\">'+soir.n+' en fleur\\u00a0: le soir seulement, '+soir.debut+' \\u2013 '+soir.fin+'</div>';") && S.ck.includes("if (tr.soir && tr.soir.debut) bTr +=")
    && S.pil.includes("(r.pousse?' · lu par la pousse':'')") && S.pil.includes("(r.fleur?' · en fleur \\u2192 le soir':'')"));
  t('⑥ la liste joue ce fichier et sa contre-épreuve', S.liste.indexOf("mv-harnais-pheno2b.mjs'") > 0 && S.liste.indexOf("mv-harnais-pheno2b.mjs --contre'") > 0);
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
    ['le coucher sans l’équation du temps', m('pil', 't=720-4*lng-eq+(lever?-4:4)*Math.acos(x)/R;', 't=720-4*lng+(lever?-4:4)*Math.acos(x)/R;')],   // FENETRE-2 (§567) : le lever passe par la même ligne
    ['le coucher sans la réfraction (90° au lieu de 90,833°)', m('pil', 'var x=Math.cos(90.833*R)/', 'var x=Math.cos(90*R)/')],
    ['le créneau du soir décalé (3 h avant, 2 h après)', m('pil', 'debut:c==null?null:_pilHm(c-120), fin:c==null?null:_pilHm(c+180)', 'debut:c==null?null:_pilHm(c-180), fin:c==null?null:_pilHm(c+120)')],
    ['la nouaison comptée en fleur', m('pil', 'var b=window._phenoStadeAu(p,aujIso); return b!=null&&b>=61&&b<=69;', 'var b=window._phenoStadeAu(p,aujIso); return b!=null&&b>=61&&b<=71;')],
    ['la pousse raccourcit aussi un systémique', m('pil', "var pousse=(e.mode==='contact'&&b!=null&&b>=16&&b<=79)", 'var pousse=(b!=null&&b>=16&&b<=79)')],
    ['le coefficient réglé ignoré', m('pil', 'o.pousse=(isFinite(Pc)&&Pc>=0.3&&Pc<=1)?Pc:_PIL_PROT_POUSSE_DEF;', 'o.pousse=_PIL_PROT_POUSSE_DEF;')],
    ['le cockpit ne dit plus le créneau du soir', m('ck', "if (tr.soir && tr.soir.debut) bTr +=", "if (false) bTr +=")],
    ['la liste ne joue plus ce fichier', (S) => Object.assign({}, S, { liste: S.liste.split("mv-harnais-pheno2b.mjs'").join("mv-harnais-phenoZb2.mjs'") })],
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
